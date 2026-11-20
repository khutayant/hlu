import { FileInfo } from '@app/entity/entities/info/file-info.entity';
import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import { EmployeeSignatureMaster } from '@app/entity/entities/master/employee-signature-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { AppEnv } from '../../../resources/env/app.env';
import { FILE_CATEGORY } from '../file/data/file-category.data';
import { FileService } from '../file/file.service';
import type { CreateEmployeeSignatureDto } from './dto/create-employee-signature.dto';
import type { SetEmployeeSignatureActiveDto } from './dto/set-employee-signature-active.dto';
import type { UpdateEmployeeSignatureDto } from './dto/update-employee-signature.dto';

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

type PublicActor = {
  id: string;
  name: string;
};

/** `[employeeNo]-[focalNo].ext` only — kebab / unmatched names are ignored. */
const EMP_FOCAL_FILE_RE =
  /^([A-Za-z]+\d+)-([A-Za-z]+\d+)\.(png|jpe?g|webp|gif)$/i;

const DEFAULT_SEED_STYLES = {
  nameFontSize: 16,
  positionFontSize: 14,
  imageScale: 1,
  textAndImageGap: 12,
} as const;

@Injectable()
export class EmployeeSignatureService {
  private readonly logger = new Logger(EmployeeSignatureService.name);

  constructor(
    @InjectRepository(EmployeeSignatureMaster)
    private readonly signatureRepository: Repository<EmployeeSignatureMaster>,
    @InjectRepository(EmployeeMaster)
    private readonly employeeRepository: Repository<EmployeeMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
    private readonly fileService: FileService,
  ) {}

  /**
   * One active signature per employee for reports / bulk UI.
   * Prefers `primary = true`; if none, uses the latest by `updatedDate`.
   */
  async listPrimaryByEmployeeIds(employeeIds: string[]) {
    const unique = [
      ...new Set(
        employeeIds
          .map((id) => id.trim())
          .filter((id) => id.length > 0),
      ),
    ];
    if (unique.length === 0) {
      return { items: [] };
    }
    if (unique.length > 500) {
      throw new BadRequestException('Too many employeeIds (max 500)');
    }

    // Postgres DISTINCT ON: primary first, then newest updatedDate.
    const rows = await this.signatureRepository
      .createQueryBuilder('signature')
      .distinctOn(['employee.id'])
      .leftJoinAndSelect('signature.employee', 'employee')
      .leftJoinAndSelect('signature.signatureImage', 'signatureImage')
      .where('employee.id IN (:...employeeIds)', { employeeIds: unique })
      .andWhere('signature.active = true')
      .orderBy('employee.id', 'ASC')
      .addOrderBy('signature.primary', 'DESC')
      .addOrderBy('signature.updatedDate', 'DESC')
      .getMany();

    const actors = await this.resolveActors(rows);
    return {
      items: rows.map((row) => this.toPublic(row, actors)),
    };
  }

  async list(options: {
    employeeId: string;
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
  }) {
    await this.requireEmployee(options.employeeId);
    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const q = options.q?.trim();
    const active = options.active ?? true;

    const qb = this.signatureRepository
      .createQueryBuilder('signature')
      .leftJoinAndSelect('signature.employee', 'employee')
      .leftJoinAndSelect('signature.signatureImage', 'signatureImage')
      .where('employee.id = :employeeId', { employeeId: options.employeeId })
      .andWhere('signature.active = :active', { active })
      .orderBy('signature.primary', 'DESC')
      .addOrderBy('signature.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(signature.name ILIKE :search ESCAPE '\\'
          OR signature.signatureName ILIKE :search ESCAPE '\\'
          OR signature.signaturePosition ILIKE :search ESCAPE '\\'
          OR COALESCE(signature.description, '') ILIKE :search ESCAPE '\\')`,
        { search: this.toIlikeContainsPattern(q) },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    const actors = await this.resolveActors(items);
    return {
      items: items.map((item) => this.toPublic(item, actors)),
      total,
      page,
      limit,
      active,
    };
  }

  async create(dto: CreateEmployeeSignatureDto, actor?: AuthUser) {
    const employee = await this.requireEmployee(dto.employeeId);
    const signatureImage = await this.resolveSignatureImage(
      dto.signatureImageId,
    );
    const makePrimary = dto.primary ?? false;
    if (makePrimary) {
      await this.clearPrimaryForEmployee(employee.id);
    }

    const signature = this.signatureRepository.create({
      employee,
      name: dto.name,
      primary: makePrimary,
      signatureImage,
      signatureName: dto.signatureName,
      signaturePosition: dto.signaturePosition,
      description: dto.description ?? null,
      signatureStyles: dto.signatureStyles ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.signatureRepository.save(signature);
    const full = await this.requireSignature(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  async update(
    id: string,
    dto: UpdateEmployeeSignatureDto,
    actor?: AuthUser,
  ) {
    const signature = await this.requireSignature(id);
    if (dto.name !== undefined) {
      signature.name = dto.name;
    }
    if (dto.signatureName !== undefined) {
      signature.signatureName = dto.signatureName;
    }
    if (dto.signaturePosition !== undefined) {
      signature.signaturePosition = dto.signaturePosition;
    }
    if (dto.description !== undefined) {
      signature.description = dto.description;
    }
    if (dto.signatureStyles !== undefined) {
      signature.signatureStyles = dto.signatureStyles;
    }
    if (dto.signatureImageId !== undefined) {
      signature.signatureImage = await this.resolveSignatureImage(
        dto.signatureImageId,
      );
    }
    if (dto.primary !== undefined) {
      if (dto.primary) {
        await this.clearPrimaryForEmployee(signature.employee.id, signature.id);
        signature.primary = true;
      } else {
        signature.primary = false;
      }
    }
    signature.updatedBy = actor?.id;
    const saved = await this.signatureRepository.save(signature);
    const full = await this.requireSignature(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  async setActive(
    id: string,
    dto: SetEmployeeSignatureActiveDto,
    actor?: AuthUser,
  ) {
    const signature = await this.requireSignature(id);
    signature.active = dto.active;
    if (!dto.active) {
      signature.primary = false;
    }
    signature.updatedBy = actor?.id;
    const saved = await this.signatureRepository.save(signature);
    const full = await this.requireSignature(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  /**
   * TEMP — seed from `local-data/e-signature/data/**` files named
   * `[employeeNo]-[focalNo].ext`. Always creates `primary: true`.
   * Skip kebab / unmatched filenames and employees not in DB.
   * Remove this method (+ public route) when seeding is done.
   */
  async seedFromLocalEmpFocalFiles() {
    const dataRoot = join(
      AppEnv.CWD,
      'local-data',
      'e-signature',
      'data',
    );
    const files = await this.listEmpFocalSignatureFiles(dataRoot);
    const summary = {
      scanned: files.length,
      created: 0,
      skippedNoEmployee: 0,
      skippedAlreadyHasSignature: 0,
      failed: 0,
      details: [] as Array<{
        file: string;
        status: string;
        employeeNo?: string;
        focalNo?: string;
        message?: string;
      }>,
    };

    for (const file of files) {
      const relative = file.relativePath;
      try {
        const employee = await this.employeeRepository.findOne({
          where: {
            employeeNo: file.employeeNo,
            focalNo: file.focalNo,
            active: true,
          },
          relations: { title: true, position: true },
        });
        if (!employee) {
          summary.skippedNoEmployee += 1;
          summary.details.push({
            file: relative,
            status: 'skipped_no_employee',
            employeeNo: file.employeeNo,
            focalNo: file.focalNo,
          });
          continue;
        }

        const existingCount = await this.signatureRepository.count({
          where: { employee: { id: employee.id } },
        });
        if (existingCount > 0) {
          summary.skippedAlreadyHasSignature += 1;
          summary.details.push({
            file: relative,
            status: 'skipped_already_has_signature',
            employeeNo: file.employeeNo,
            focalNo: file.focalNo,
          });
          continue;
        }

        const uploaded = await this.fileService.uploadFromDiskPath({
          sourcePath: file.absolutePath,
          originalName: file.fileName,
          categoryCode: FILE_CATEGORY.SIGNATURE_IMAGE.code,
          description: `Seeded from ${relative}`,
        });

        const displayName = employee.displayName?.trim() || file.employeeNo;
        const signatureName = [employee.title?.name, displayName]
          .filter(Boolean)
          .join(' ')
          .trim();
        const signaturePosition =
          employee.position?.name?.trim() || '—';

        await this.clearPrimaryForEmployee(employee.id);
        const signature = this.signatureRepository.create({
          employee,
          name: displayName,
          primary: true,
          signatureImage: uploaded,
          signatureName,
          signaturePosition,
          description: `Seeded from ${relative}`,
          signatureStyles: { ...DEFAULT_SEED_STYLES },
          active: true,
        });
        await this.signatureRepository.save(signature);

        summary.created += 1;
        summary.details.push({
          file: relative,
          status: 'created',
          employeeNo: file.employeeNo,
          focalNo: file.focalNo,
        });
      } catch (error) {
        summary.failed += 1;
        const message =
          error instanceof Error ? error.message : 'Unknown seed error';
        this.logger.warn(`Seed failed for ${relative}: ${message}`);
        summary.details.push({
          file: relative,
          status: 'failed',
          employeeNo: file.employeeNo,
          focalNo: file.focalNo,
          message,
        });
      }
    }

    return summary;
  }

  private async listEmpFocalSignatureFiles(dataRoot: string): Promise<
    Array<{
      absolutePath: string;
      relativePath: string;
      fileName: string;
      employeeNo: string;
      focalNo: string;
    }>
  > {
    const results: Array<{
      absolutePath: string;
      relativePath: string;
      fileName: string;
      employeeNo: string;
      focalNo: string;
    }> = [];

    const walk = async (dir: string, relativeDir: string) => {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        throw new BadRequestException(
          `Signature data folder not found: ${dataRoot}`,
        );
      }
      for (const entry of entries) {
        if (entry.name.startsWith('.')) {
          continue;
        }
        const absolutePath = join(dir, entry.name);
        const relativePath = relativeDir
          ? `${relativeDir}/${entry.name}`
          : entry.name;
        if (entry.isDirectory()) {
          await walk(absolutePath, relativePath);
          continue;
        }
        const match = EMP_FOCAL_FILE_RE.exec(entry.name);
        if (!match) {
          continue;
        }
        const info = await stat(absolutePath);
        if (!info.isFile()) {
          continue;
        }
        results.push({
          absolutePath,
          relativePath,
          fileName: entry.name,
          employeeNo: match[1].toUpperCase(),
          focalNo: match[2].toUpperCase(),
        });
      }
    };

    await walk(dataRoot, '');
    results.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
    return results;
  }

  private async clearPrimaryForEmployee(
    employeeId: string,
    excludeId?: string,
  ) {
    const qb = this.signatureRepository
      .createQueryBuilder()
      .update(EmployeeSignatureMaster)
      .set({ primary: false })
      .where('"employeeId" = :employeeId', { employeeId })
      .andWhere('"primary" = true');
    if (excludeId) {
      qb.andWhere('id != :excludeId', { excludeId });
    }
    await qb.execute();
  }

  private async requireEmployee(id: string) {
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: { position: true },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  private async requireSignature(id: string) {
    const signature = await this.signatureRepository.findOne({
      where: { id },
      relations: {
        employee: true,
        signatureImage: true,
      },
    });
    if (!signature) {
      throw new NotFoundException('Employee signature not found');
    }
    return signature;
  }

  private async resolveSignatureImage(fileId: string): Promise<FileInfo> {
    const file = await this.fileService.requireActiveFileById(fileId);
    const mime = (file.mimeType || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      throw new BadRequestException(
        'Only PNG, JPEG, WebP, AVIF, or GIF images are allowed',
      );
    }
    if (
      file.category?.code &&
      file.category.code !== FILE_CATEGORY.SIGNATURE_IMAGE.code
    ) {
      throw new BadRequestException('File category must be SIGNATURE_IMAGE');
    }
    return file;
  }

  private async resolveActors(
    rows: readonly EmployeeSignatureMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        rows
          .flatMap((row) => [row.createdBy, row.updatedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const map = new Map<string, PublicActor>();
    if (ids.length === 0) {
      return map;
    }
    const users = await this.userRepository.find({ where: { id: In(ids) } });
    for (const user of users) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      map.set(user.id, {
        id: user.id,
        name: fullName || user.username,
      });
    }
    return map;
  }

  private toPublic(
    signature: EmployeeSignatureMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: signature.id,
      employeeId: signature.employee.id,
      name: signature.name,
      primary: signature.primary,
      signatureName: signature.signatureName,
      signaturePosition: signature.signaturePosition,
      description: signature.description ?? null,
      signatureStyles: signature.signatureStyles ?? null,
      signatureImage: signature.signatureImage
        ? {
            id: signature.signatureImage.id,
            uuidName: signature.signatureImage.uuidName,
            mimeType: signature.signatureImage.mimeType,
          }
        : null,
      active: signature.active,
      createdDate: signature.createdDate,
      updatedDate: signature.updatedDate,
      createdBy: signature.createdBy
        ? (actors.get(signature.createdBy) ?? {
            id: signature.createdBy,
            name: signature.createdBy,
          })
        : null,
      updatedBy: signature.updatedBy
        ? (actors.get(signature.updatedBy) ?? {
            id: signature.updatedBy,
            name: signature.updatedBy,
          })
        : null,
    };
  }

  private toIlikeContainsPattern(raw: string): string {
    const escaped = raw
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
    return `%${escaped}%`;
  }
}
