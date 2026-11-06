import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';
import { parseUploadFileDto } from './dto/upload-file.dto.js';
import { uploadFileMulterOptions } from './file.multer.js';
import { FileService } from './file.service.js';

/**
 * File API under `/api/{base}/v1/file`.
 *
 * Auth required (global guard). Multipart field name is always `file`.
 * Body fields: `categoryId` (required), `name` / `description` (optional).
 */
@Controller('file')
export class FileController {
  constructor(private readonly fileService: FileService) {}

  /**
   * Upload a single file as-is.
   *
   * `POST /file/upload`
   *
   * @returns Saved file metadata (not the binary).
   */
  @Post('upload')
  @UseInterceptors(FileInterceptor('file', uploadFileMulterOptions))
  async upload(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: unknown,
  ) {
    return this.handleUpload(request, file, body, 'single');
  }

  /**
   * Upload a zip that contains exactly one file; extract and store that file.
   *
   * `POST /file/upload-zip`
   *
   * @throws BadRequestException if the zip does not contain exactly one file.
   * @returns Saved file metadata for the extracted entry.
   */
  @Post('upload-zip')
  @UseInterceptors(FileInterceptor('file', uploadFileMulterOptions))
  async uploadZip(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: unknown,
  ) {
    return this.handleUpload(request, file, body, 'zip');
  }

  /**
   * Upload a zip with multiple files. All entries share the same category
   * and description; each is unzipped and saved as its own `FileInfo`.
   *
   * `POST /file/upload-bulk-zip`
   *
   * @returns Array of saved file metadata.
   */
  @Post('upload-bulk-zip')
  @UseInterceptors(FileInterceptor('file', uploadFileMulterOptions))
  async uploadBulkZip(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
    @Body() body: unknown,
  ) {
    return this.handleUpload(request, file, body, 'bulk-zip');
  }

  /**
   * List active files (metadata only), newest first.
   *
   * `GET /file?categoryId=&page=&limit=`
   *
   * @param categoryId Optional category filter.
   * @param page 1-based page (default 1).
   * @param limit Page size (default 20, max 100).
   */
  @Get()
  list(
    @Query('categoryId') categoryId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.fileService.list({
      categoryId: categoryId?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Stream the full stored file by storage `uuidName`.
   *
   * `GET /file/:uuidName`
   *
   * Response is the binary with `Content-Type` from metadata and
   * `Content-Disposition: inline`.
   *
   * @param uuidName Storage UUID filename (not the DB id).
   */
  @Get(':uuidName')
  async getByUuidName(
    @Param('uuidName') uuidName: string,
  ): Promise<StreamableFile> {
    const { fileInfo, stream } =
      await this.fileService.openByUuidName(uuidName);

    return new StreamableFile(stream, {
      type: fileInfo.mimeType,
      disposition: `inline; filename="${encodeURIComponent(fileInfo.name)}"`,
      length: Number(fileInfo.size),
    });
  }

  /**
   * Shared multipart upload handler for single / zip / bulk-zip modes.
   */
  private async handleUpload(
    request: Request,
    file: Express.Multer.File,
    body: unknown,
    mode: 'single' | 'zip' | 'bulk-zip',
  ) {
    try {
      const dto = parseUploadFileDto(body);
      const userId = request.user?.id;

      if (mode === 'zip') {
        const saved = await this.fileService.uploadZip(file, dto, userId);
        return this.fileService.toPublicFile(saved);
      }

      if (mode === 'bulk-zip') {
        const saved = await this.fileService.uploadBulkZip(file, dto, userId);
        return saved.map((item) => this.fileService.toPublicFile(item));
      }

      const saved = await this.fileService.upload(file, dto, userId);
      return this.fileService.toPublicFile(saved);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
