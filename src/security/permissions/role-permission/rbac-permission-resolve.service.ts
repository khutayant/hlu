import {
  UserRolePermissionMapping,
  UserUserRoleMapping,
} from '@app/entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  anyPermissionSatisfies,
  type PermissionRef,
} from '../tools/matches-permission.tool.js';

const ACTIVE_DELETED_TOKEN = 'NA';

/**
 * Permissions granted to a user through active user-role assignments.
 * `all` + `manage` is handled by {@link anyPermissionSatisfies}.
 */
@Injectable()
export class RbacPermissionResolveService {
  constructor(
    @InjectRepository(UserRolePermissionMapping)
    private readonly rolePermissionRepository: Repository<UserRolePermissionMapping>,
  ) {}

  async resolveForUser(userId: string): Promise<PermissionRef[]> {
    const mappings = await this.rolePermissionRepository
      .createQueryBuilder('rolePermission')
      .innerJoinAndSelect('rolePermission.permission', 'permission')
      .innerJoin('rolePermission.userRole', 'role')
      .innerJoin(
        UserUserRoleMapping,
        'userRoleMap',
        [
          'userRoleMap.userRoleId = role.id',
          'userRoleMap.userId = :userId',
          'userRoleMap.active = :active',
          'userRoleMap.deletedToken = :deletedToken',
        ].join(' AND '),
      )
      .where('rolePermission.active = :active')
      .andWhere('permission.active = :active')
      .andWhere('role.active = :active')
      .andWhere('role.deletedToken = :deletedToken')
      .setParameters({
        userId,
        active: true,
        deletedToken: ACTIVE_DELETED_TOKEN,
      })
      .getMany();

    return mappings.map((mapping) => ({
      subject: mapping.permission.subject,
      action: mapping.permission.action,
    }));
  }

  isGranted(
    grants: readonly PermissionRef[],
    required: PermissionRef,
  ): boolean {
    return anyPermissionSatisfies(grants, required);
  }
}
