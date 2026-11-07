import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { FileInfo } from '../../../../libs/entity/src/index.js';
import { UserMaster } from '../../../../libs/entity/src/index.js';
import { FILE_CATEGORY } from '../file/data/file-category.data.js';
import { FileService } from '../file/file.service.js';

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

@Injectable()
export class UserProfileService {
  constructor(
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
    private readonly fileService: FileService,
  ) {}

  /**
   * Link an already-uploaded file (via `/file/upload`) as the owner's profile image.
   */
  async setProfileImage(userId: string, fileId: string) {
    const user = await this.requireOwner(userId);
    const file = await this.requireOwnerImageFile(
      userId,
      fileId,
      FILE_CATEGORY.PROFILE_IMAGE.code,
    );
    user.profileImage = file;
    user.updatedBy = userId;
    await this.userRepository.save(user);
    return this.loadPublicOwner(userId);
  }

  /**
   * Link an already-uploaded file (via `/file/upload`) as the owner's cover image.
   */
  async setCoverImage(userId: string, fileId: string) {
    const user = await this.requireOwner(userId);
    const file = await this.requireOwnerImageFile(
      userId,
      fileId,
      FILE_CATEGORY.COVER_IMAGE.code,
    );
    user.coverImage = file;
    user.updatedBy = userId;
    await this.userRepository.save(user);
    return this.loadPublicOwner(userId);
  }

  async clearProfileImage(userId: string) {
    const user = await this.requireOwner(userId);
    user.profileImage = null;
    user.updatedBy = userId;
    await this.userRepository.save(user);
    return this.loadPublicOwner(userId);
  }

  async clearCoverImage(userId: string) {
    const user = await this.requireOwner(userId);
    user.coverImage = null;
    user.updatedBy = userId;
    await this.userRepository.save(user);
    return this.loadPublicOwner(userId);
  }

  private async requireOwnerImageFile(
    userId: string,
    fileId: string,
    expectedCategoryCode: string,
  ): Promise<FileInfo> {
    const file = await this.fileService.requireActiveFileById(fileId);
    const mime = (file.mimeType || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      throw new BadRequestException(
        'Only PNG, JPEG, WebP, AVIF, or GIF images are allowed',
      );
    }
    if (file.createdBy && file.createdBy !== userId) {
      throw new BadRequestException('File does not belong to this account');
    }
    if (file.category?.code && file.category.code !== expectedCategoryCode) {
      throw new BadRequestException('File category does not match');
    }
    return file;
  }

  /** Always load by the authenticated account id — never by a client-supplied user id. */
  private async requireOwner(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId, active: true },
      relations: { profileImage: true, coverImage: true },
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  private async loadPublicOwner(userId: string) {
    const user = await this.requireOwner(userId);
    return toPublicUserProfile(user);
  }
}

export function toPublicUserProfile(user: UserMaster) {
  return {
    id: user.id,
    keycloakId: user.keycloakId,
    username: user.username,
    email: user.email,
    emailVerified: user.emailVerified,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    lastLoginAt: user.lastLoginAt,
    profileImage: user.profileImage
      ? {
          id: user.profileImage.id,
          uuidName: user.profileImage.uuidName,
          mimeType: user.profileImage.mimeType,
        }
      : null,
    coverImage: user.coverImage
      ? {
          id: user.coverImage.id,
          uuidName: user.coverImage.uuidName,
          mimeType: user.coverImage.mimeType,
        }
      : null,
  };
}
