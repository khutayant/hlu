import {
  ModuleMaster,
  PermissionMaster,
  UserRoleMaster,
  UserRoleModuleMapping,
  UserRolePermissionMapping,
} from '@app/entity';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { ADMIN_RELATIONSHIP_SEED_ROWS } from './admin-relationship-seed.data.js';

const ACTIVE_DELETED_TOKEN = 'NA';

/**
 * After modules, `UserRoleMaster`, and permissions are in DB, attach ADMIN
 * relationships (e.g. `ALL_SYSTEM` + `PERM_ALL_MANAGE`).
 *
 * Invoked only from {@link PermissionSeedService} after a successful permission seed.
 */
@Injectable()
export class AdminRelationshipSeedService {
  private readonly logger = new Logger(AdminRelationshipSeedService.name);

  constructor(
    @InjectRepository(UserRoleMaster)
    private readonly userRoleRepository: Repository<UserRoleMaster>,
    @InjectRepository(ModuleMaster)
    private readonly moduleRepository: Repository<ModuleMaster>,
    @InjectRepository(PermissionMaster)
    private readonly permissionRepository: Repository<PermissionMaster>,
    @InjectRepository(UserRoleModuleMapping)
    private readonly moduleMappingRepository: Repository<UserRoleModuleMapping>,
    @InjectRepository(UserRolePermissionMapping)
    private readonly permissionMappingRepository: Repository<UserRolePermissionMapping>,
  ) {}

  async seed(): Promise<void> {
    let modulesLinked = 0;
    let permissionsLinked = 0;

    for (const row of ADMIN_RELATIONSHIP_SEED_ROWS) {
      const role = await this.userRoleRepository.findOne({
        where: {
          code: row.roleCode,
          deletedToken: ACTIVE_DELETED_TOKEN,
          active: true,
        },
      });

      if (!role) {
        throw new Error(
          `Admin relationship seed: role "${row.roleCode}" was not found (seed user-role-master first)`,
        );
      }

      for (const moduleCode of row.moduleCodes) {
        const linked = await this.ensureModuleLink(role, moduleCode);
        if (linked) {
          modulesLinked += 1;
        }
      }

      for (const permissionCode of row.permissionCodes) {
        const linked = await this.ensurePermissionLink(role, permissionCode);
        if (linked) {
          permissionsLinked += 1;
        }
      }
    }

    this.logger.log(
      `Admin relationship seed complete: roles=${ADMIN_RELATIONSHIP_SEED_ROWS.length} modulesLinked=${modulesLinked} permissionsLinked=${permissionsLinked}`,
    );
  }

  private async ensureModuleLink(
    role: UserRoleMaster,
    moduleCode: string,
  ): Promise<boolean> {
    const module = await this.moduleRepository.findOne({
      where: { code: moduleCode, active: true },
    });
    if (!module) {
      throw new Error(
        `Admin relationship seed: module "${moduleCode}" was not found (seed module-master first)`,
      );
    }

    const existing = await this.moduleMappingRepository.find({
      where: {
        userRole: { id: role.id },
        module: { id: module.id },
      },
      order: { createdDate: 'DESC' },
    });

    const active = existing.find((row) => row.active);
    if (active) {
      return false;
    }

    const inactive = existing.find((row) => !row.active);
    if (inactive) {
      inactive.active = true;
      await this.moduleMappingRepository.save(inactive);
      return true;
    }

    await this.moduleMappingRepository.save(
      this.moduleMappingRepository.create({
        userRole: role,
        module,
        active: true,
      }),
    );
    return true;
  }

  private async ensurePermissionLink(
    role: UserRoleMaster,
    permissionCode: string,
  ): Promise<boolean> {
    const permission = await this.permissionRepository.findOne({
      where: { code: permissionCode, active: true },
    });
    if (!permission) {
      throw new Error(
        `Admin relationship seed: permission "${permissionCode}" was not found (seed permissions first)`,
      );
    }

    const existing = await this.permissionMappingRepository.find({
      where: {
        userRole: { id: role.id },
        permission: { id: permission.id },
      },
      order: { createdDate: 'DESC' },
    });

    const active = existing.find((row) => row.active);
    if (active) {
      return false;
    }

    const inactive = existing.find((row) => !row.active);
    if (inactive) {
      inactive.active = true;
      await this.permissionMappingRepository.save(inactive);
      return true;
    }

    await this.permissionMappingRepository.save(
      this.permissionMappingRepository.create({
        userRole: role,
        permission,
        active: true,
      }),
    );
    return true;
  }
}
