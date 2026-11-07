import {
  CategoryMaster,
  FileInfo,
} from '../../../../libs/entity/src/index.js';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import AdmZip from 'adm-zip';
import { createHash } from 'crypto';
import { constants, createReadStream, writeFileSync } from 'fs';
import {
  access,
  copyFile,
  mkdir,
  mkdtemp,
  rename,
  rm,
  stat,
  unlink,
} from 'fs/promises';
import { basename, dirname, extname, join } from 'path';
import type { Readable } from 'stream';
import { pipeline } from 'stream/promises';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { CODE_STRUCTURE } from '../../../resources/data/code-structure/code-structure.data.js';
import { AppEnv } from '../../../resources/env/app.env.js';
import { GenCodeService } from '../../../services/global/gen-code/gen-code.service.js';
import {
  FILE_CATEGORY,
  isFileCategoryCode,
} from './data/file-category.data.js';
import type { UploadFileDto } from './dto/upload-file.dto.js';

type ExtractedZipEntry = {
  name: string;
  path: string;
  size: number;
};

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private readonly uploadsDir = join(AppEnv.STORAGE_DIR, 'uploads');

  constructor(
    @InjectRepository(FileInfo)
    private readonly fileRepository: Repository<FileInfo>,
    @InjectRepository(CategoryMaster)
    private readonly categoryRepository: Repository<CategoryMaster>,
    private readonly genCodeService: GenCodeService,
  ) {}

  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
    userId?: string,
  ): Promise<FileInfo> {
    const tempPath = file?.path;
    if (!tempPath || !file) {
      throw new BadRequestException('File is required');
    }

    const category = await this.requireCategory(dto.categoryId, tempPath);

    let tempRemoved = false;
    const removeTemp = async () => {
      if (tempRemoved) {
        return;
      }
      tempRemoved = true;
      await unlink(tempPath).catch(() => undefined);
    };

    try {
      return await this.persistFromTempPath({
        tempPath,
        originalName: dto.name || file.originalname || 'file',
        mimeType: file.mimetype || 'application/octet-stream',
        size: file.size,
        category,
        description: dto.description ?? null,
        userId,
        onMoved: () => {
          tempRemoved = true;
        },
      });
    } finally {
      await removeTemp();
    }
  }

  /**
   * Zip must contain exactly one file. That file is extracted and stored.
   */
  async uploadZip(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
    userId?: string,
  ): Promise<FileInfo> {
    const entries = await this.extractZipToTemp(file);
    try {
      if (entries.length !== 1) {
        throw new BadRequestException(
          `upload-zip requires exactly one file inside the zip (found ${entries.length})`,
        );
      }

      const [entry] = entries;
      const category = await this.requireCategory(dto.categoryId);

      return await this.persistFromTempPath({
        tempPath: entry.path,
        originalName: dto.name || entry.name,
        mimeType: this.guessMimeType(entry.name),
        size: entry.size,
        category,
        description: dto.description ?? null,
        userId,
      });
    } finally {
      await this.cleanupExtractDir(entries);
    }
  }

  /**
   * Zip may contain many files. Each is stored separately with the same
   * category and description.
   */
  async uploadBulkZip(
    file: Express.Multer.File | undefined,
    dto: UploadFileDto,
    userId?: string,
  ): Promise<FileInfo[]> {
    const entries = await this.extractZipToTemp(file);
    try {
      if (entries.length < 1) {
        throw new BadRequestException('Zip archive has no files');
      }

      const category = await this.requireCategory(dto.categoryId);
      const saved: FileInfo[] = [];

      for (const entry of entries) {
        const fileInfo = await this.persistFromTempPath({
          tempPath: entry.path,
          originalName: entry.name,
          mimeType: this.guessMimeType(entry.name),
          size: entry.size,
          category,
          description: dto.description ?? null,
          userId,
        });
        saved.push(fileInfo);
      }

      return saved;
    } finally {
      await this.cleanupExtractDir(entries);
    }
  }

  async list(options?: {
    categoryId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));

    const qb = this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.category', 'category')
      .where('file.active = :active', { active: true })
      .orderBy('file.createdDate', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (options?.categoryId) {
      qb.andWhere('category.id = :categoryId', {
        categoryId: options.categoryId,
      });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toPublicFile(item)),
      total,
      page,
      limit,
    };
  }

  async openByUuidName(
    uuidName: string,
  ): Promise<{ fileInfo: FileInfo; stream: Readable }> {
    const fileInfo = await this.fileRepository.findOne({
      where: { uuidName, active: true },
      relations: { category: true },
    });

    if (!fileInfo) {
      throw new NotFoundException('File not found');
    }

    const filePath = this.resolveStoredPath(fileInfo);

    try {
      await access(filePath, constants.F_OK);
    } catch {
      this.logger.error(`Upload file missing on disk: ${filePath}`);
      throw new NotFoundException('File not found');
    }

    return {
      fileInfo,
      stream: createReadStream(filePath),
    };
  }

  toPublicFile(file: FileInfo) {
    return {
      id: file.id,
      fileNo: file.fileNo,
      name: file.name,
      mimeType: file.mimeType,
      size: Number(file.size),
      uuidName: file.uuidName,
      checksum: file.checksum,
      folder: file.folder,
      description: file.description,
      createdDate: file.createdDate,
      updatedDate: file.updatedDate,
      category: file.category
        ? {
            id: file.category.id,
            name: file.category.name,
            code: file.category.code,
          }
        : null,
    };
  }

  /**
   * Find an active category by known code, or create one (`isPosting=false`).
   * Only codes listed in {@link FILE_CATEGORY} are allowed.
   */
  async ensureKnownCategoryByCode(code: string): Promise<CategoryMaster> {
    if (!isFileCategoryCode(code)) {
      throw new BadRequestException('Unknown file category code');
    }

    const meta = FILE_CATEGORY[code];
    const existing = await this.categoryRepository.findOne({
      where: { code: meta.code, active: true },
    });
    if (existing) {
      return existing;
    }

    const parent = meta.parentCode
      ? await this.ensureKnownCategoryByCode(meta.parentCode)
      : null;
    const created = this.categoryRepository.create({
      code: meta.code,
      name: meta.name,
      description: meta.description,
      isPosting: false,
      parentCategory: parent,
      active: true,
    });
    return this.categoryRepository.save(created);
  }

  toPublicCategory(category: CategoryMaster) {
    return {
      id: category.id,
      code: category.code,
      name: category.name,
      description: category.description ?? null,
    };
  }

  async requireActiveFileById(fileId: string): Promise<FileInfo> {
    const file = await this.fileRepository.findOne({
      where: { id: fileId, active: true },
      relations: { category: true },
    });
    if (!file) {
      throw new NotFoundException('File not found');
    }
    return file;
  }

  private async requireCategory(categoryId: string, unlinkPath?: string) {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, active: true },
    });
    if (!category) {
      if (unlinkPath) {
        await unlink(unlinkPath).catch(() => undefined);
      }
      throw new BadRequestException('Category not found');
    }
    return category;
  }

  private async persistFromTempPath(options: {
    tempPath: string;
    originalName: string;
    mimeType: string;
    size: number;
    category: CategoryMaster;
    description?: string | null;
    userId?: string;
    onMoved?: () => void;
  }): Promise<FileInfo> {
    const checksum = await this.computeChecksum(options.tempPath);
    const uuidName = uuidv4();
    const folder = this.currentFolder();
    const targetDir = join(this.uploadsDir, folder);
    const filePath = join(targetDir, uuidName);

    await mkdir(targetDir, { recursive: true });

    let moved = false;
    try {
      await rename(options.tempPath, filePath);
      moved = true;
      options.onMoved?.();
    } catch {
      await copyFile(options.tempPath, filePath);
      await unlink(options.tempPath).catch(() => undefined);
      moved = true;
      options.onMoved?.();
    }

    try {
      const fileNo = await this.genCodeService.getInfoCode({
        structure: CODE_STRUCTURE.fileNo,
      });

      const fileInfo = this.fileRepository.create({
        category: options.category,
        fileNo,
        name: truncateFileName(options.originalName, 125),
        mimeType: options.mimeType,
        size: options.size,
        uuidName,
        checksum,
        folder,
        description: options.description ?? null,
        createdBy: options.userId ?? null,
        updatedBy: options.userId ?? null,
        active: true,
      });

      return await this.fileRepository.save(fileInfo);
    } catch (error) {
      if (moved) {
        await unlink(filePath).catch(() => undefined);
      }
      this.logger.error('Failed to save file info', error as Error);
      throw error;
    }
  }

  /** `YYYY-MM` for the current date (storage subfolder). */
  private currentFolder(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private resolveStoredPath(fileInfo: FileInfo): string {
    if (fileInfo.folder) {
      return join(this.uploadsDir, fileInfo.folder, fileInfo.uuidName);
    }

    // Legacy layout: uploads/{YYYY}/{uuidName}
    const year = new Date(fileInfo.createdDate).getFullYear();
    return join(this.uploadsDir, String(year), fileInfo.uuidName);
  }

  private async extractZipToTemp(
    file: Express.Multer.File | undefined,
  ): Promise<ExtractedZipEntry[]> {
    const zipPath = file?.path;
    if (!zipPath || !file) {
      throw new BadRequestException('Zip file is required');
    }

    this.assertZipUpload(file);

    const extractRoot = await mkdtemp(join(AppEnv.TEMP_DIR, 'unzip-'));
    const entries: ExtractedZipEntry[] = [];

    try {
      const zip = new AdmZip(zipPath);
      const zipEntries = zip.getEntries();

      for (const entry of zipEntries) {
        if (entry.isDirectory) {
          continue;
        }

        const entryName = entry.entryName.replace(/\\/g, '/');
        if (
          entryName.includes('..') ||
          entryName.startsWith('/') ||
          entryName.includes('__MACOSX/') ||
          basename(entryName).startsWith('.')
        ) {
          continue;
        }

        const safeName = basename(entryName);
        if (!safeName) {
          continue;
        }

        const data = entry.getData();
        if (!data?.length) {
          continue;
        }

        const outPath = join(extractRoot, `${uuidv4()}-${safeName}`);
        writeFileSync(outPath, data);
        const info = await stat(outPath);
        entries.push({
          name: safeName,
          path: outPath,
          size: info.size,
        });
      }

      await unlink(zipPath).catch(() => undefined);
      return entries;
    } catch (error) {
      await unlink(zipPath).catch(() => undefined);
      await rm(extractRoot, { recursive: true, force: true }).catch(
        () => undefined,
      );
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Failed to extract zip', error as Error);
      throw new BadRequestException('Invalid zip file');
    }
  }

  private async cleanupExtractDir(entries: ExtractedZipEntry[]) {
    const dirs = new Set(entries.map((entry) => dirname(entry.path)));
    for (const entry of entries) {
      await unlink(entry.path).catch(() => undefined);
    }
    for (const dir of dirs) {
      await rm(dir, { recursive: true, force: true }).catch(() => undefined);
    }
  }

  private assertZipUpload(file: Express.Multer.File) {
    const name = (file.originalname || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();
    const looksLikeZip =
      name.endsWith('.zip') ||
      mime.includes('zip') ||
      mime === 'application/octet-stream';

    if (!looksLikeZip) {
      throw new BadRequestException('Uploaded file must be a .zip archive');
    }
  }

  private guessMimeType(fileName: string): string {
    const ext = extname(fileName).toLowerCase();
    const map: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
      '.json': 'application/json',
      '.xml': 'application/xml',
      '.doc': 'application/msword',
      '.docx':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return map[ext] || 'application/octet-stream';
  }

  private async computeChecksum(filePath: string): Promise<string> {
    const hash = createHash('sha256');
    await pipeline(createReadStream(filePath), hash);
    return hash.digest('hex');
  }
}

/** Keep basename within column length; preserve the file extension when possible. */
function truncateFileName(name: string, maxLength: number): string {
  const trimmed = (name || 'file').trim() || 'file';
  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const extension = extname(trimmed);
  if (!extension || extension.length >= maxLength) {
    return trimmed.slice(0, maxLength);
  }

  const base = basename(trimmed, extension);
  const maxBase = maxLength - extension.length;
  return `${base.slice(0, Math.max(1, maxBase))}${extension}`;
}
