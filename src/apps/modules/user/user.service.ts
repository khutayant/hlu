import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { UserRoleEnum } from '../../../../libs/entity/src/enums/user-role.enum';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { AppEnv } from '../../../resources/env/app.env';
import type { SetUserActiveDto } from './dto/set-user-active.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
  ) {}

  /**
   * List users for admin screens (`q`, page, limit, active).
   * `active` defaults to `true` when omitted.
   */
  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();
    const active = options?.active ?? true;

    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.profileImage', 'profileImage')
      .where('user.active = :active', { active })
      .orderBy('user.username', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(user.username ILIKE :userSearch ESCAPE '\\'
          OR COALESCE(user.email, '') ILIKE :userSearch ESCAPE '\\'
          OR COALESCE(user.firstName, '') ILIKE :userSearch ESCAPE '\\'
          OR COALESCE(user.lastName, '') ILIKE :userSearch ESCAPE '\\')`,
        { userSearch: this.toIlikeContainsPattern(q) },
      );
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((user) => this.toPublicUser(user)),
      total,
      page,
      limit,
      active,
    };
  }

  /**
   * Set a user's active flag. Actor must be ADMIN and cannot change themselves.
   */
  async setActive(id: string, dto: SetUserActiveDto, actor: AuthUser) {
    if (actor.id === id) {
      throw new ForbiddenException('You cannot change your own status');
    }
    if (!this.canManageUserStatus(actor)) {
      throw new ForbiddenException('Only an admin can change user status');
    }

    const user = await this.userRepository.findOne({
      where: { id },
      relations: { profileImage: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.active = dto.active;
    user.updatedBy = actor.id;
    const saved = await this.userRepository.save(user);
    return this.toPublicUser(saved);
  }

  private toPublicUser(user: UserMaster) {
    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      id: user.id,
      username: user.username,
      email: user.email ?? null,
      displayName: fullName || user.username,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      role: user.role,
      emailVerified: user.emailVerified,
      active: user.active,
      lastLoginAt: user.lastLoginAt ?? null,
      createdDate: user.createdDate,
      updatedDate: user.updatedDate,
      profileImage: user.profileImage
        ? {
            id: user.profileImage.id,
            uuidName: user.profileImage.uuidName,
            mimeType: user.profileImage.mimeType,
          }
        : null,
    };
  }

  private canManageUserStatus(actor: AuthUser) {
    if (actor.role === UserRoleEnum.ADMIN) {
      return true;
    }
    const configured = AppEnv.SYSTEM_ADMIN_USERNAME.trim().toLowerCase();
    if (!configured) {
      return false;
    }
    return actor.username.trim().toLowerCase() === configured;
  }

  private toIlikeContainsPattern(value: string) {
    return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
  }
}
