import {
  ModuleMaster,
  PermissionMaster,
  UserMaster,
  UserRoleMaster,
  UserRoleModuleMapping,
  UserRolePermissionMapping,
  UserUserRoleMapping,
} from '../../../../libs/entity/src/index.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  In,
  Repository,
  type ObjectLiteral,
  type SelectQueryBuilder,
} from 'typeorm';
import type { AddUserRoleModuleDto } from './dto/add-user-role-module.dto.js';
import type { AddUserRolePermissionDto } from './dto/add-user-role-permission.dto.js';
import type { AddUserRoleUserDto } from './dto/add-user-role-user.dto.js';
import type { CreateUserRoleDto } from './dto/create-user-role.dto.js';
import type { SetUserRolePermissionsDto } from './dto/set-user-role-permissions.dto.js';
import type { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

const ACTIVE_DELETED_TOKEN = 'NA';
const ROLE_CODE_PATTERN = /^[A-Z0-9_]+$/;
/** Role module that grants every active system. */
const ALL_SYSTEM_MODULE_CODE = 'ALL_SYSTEM';

type PublicActor = {
  id: string;
  name: string;
} | null;

@Injectable()
export class UserRoleService {
  constructor(
    @InjectRepository(UserRoleMaster)
    private readonly userRoleRepository: Repository<UserRoleMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
    @InjectRepository(PermissionMaster)
    private readonly permissionRepository: Repository<PermissionMaster>,
    @InjectRepository(UserRolePermissionMapping)
    private readonly mappingRepository: Repository<UserRolePermissionMapping>,
    @InjectRepository(ModuleMaster)
    private readonly moduleRepository: Repository<ModuleMaster>,
    @InjectRepository(UserRoleModuleMapping)
    private readonly moduleMappingRepository: Repository<UserRoleModuleMapping>,
    @InjectRepository(UserUserRoleMapping)
    private readonly userRoleUserMappingRepository: Repository<UserUserRoleMapping>,
  ) {}

  async list(options?: { page?: number; limit?: number; q?: string }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.userRoleRepository
      .createQueryBuilder('role')
      .where('role.active = :active', { active: true })
      .andWhere('role.deletedToken = :deletedToken', {
        deletedToken: ACTIVE_DELETED_TOKEN,
      })
      .orderBy('role.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        '(role.name ILIKE :q OR role.code ILIKE :q OR COALESCE(role.description, \'\') ILIKE :q)',
        { q: `%${q}%` },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    const actors = await this.resolveActors(items);

    return {
      items: items.map((item) => this.toPublicRole(item, actors)),
      total,
      page,
      limit,
    };
  }

  async getById(id: string) {
    const role = await this.requireActiveRole(id);
    const actors = await this.resolveActors([role]);
    const permissions = await this.listActivePermissionsForRole(role.id);
    return {
      ...this.toPublicRole(role, actors),
      permissions: permissions.map((permission) =>
        this.toPublicPermission(permission),
      ),
    };
  }

  async create(dto: CreateUserRoleDto, userId?: string) {
    const name = dto.name.trim();
    const code = this.normalizeCode(dto.code);

    await this.assertUniqueNameCode(name, code);

    const role = this.userRoleRepository.create({
      name,
      code,
      description: dto.description ?? null,
      deletedToken: ACTIVE_DELETED_TOKEN,
      active: true,
      createdBy: userId ?? null,
      updatedBy: userId ?? null,
    });

    const saved = await this.userRoleRepository.save(role);
    const actors = await this.resolveActors([saved]);
    return this.toPublicRole(saved, actors);
  }

  async update(id: string, dto: UpdateUserRoleDto, userId?: string) {
    const role = await this.requireActiveRole(id);

    const nextName = dto.name !== undefined ? dto.name.trim() : role.name;
    await this.assertUniqueNameCode(nextName, role.code, role.id);

    role.name = nextName;
    if (dto.description !== undefined) {
      role.description = dto.description;
    }
    role.updatedBy = userId ?? null;

    const saved = await this.userRoleRepository.save(role);
    const actors = await this.resolveActors([saved]);
    return this.toPublicRole(saved, actors);
  }

  async softDelete(id: string, userId?: string) {
    const role = await this.requireActiveRole(id);

    role.active = false;
    role.deletedToken = role.id;
    role.updatedBy = userId ?? null;
    await this.userRoleRepository.save(role);

    const activeMappings = await this.mappingRepository.find({
      where: { userRole: { id: role.id }, active: true },
    });
    for (const mapping of activeMappings) {
      mapping.active = false;
      mapping.updatedBy = userId ?? null;
      await this.mappingRepository.save(mapping);
    }

    return { id: role.id, deleted: true };
  }

  async setPermissions(
    id: string,
    dto: SetUserRolePermissionsDto,
    userId?: string,
  ) {
    const role = await this.requireActiveRole(id);
    const permissionIds = dto.permissionIds;

    if (permissionIds.length > 0) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(permissionIds), active: true },
      });
      if (permissions.length !== permissionIds.length) {
        throw new BadRequestException('One or more permissions were not found');
      }
    }

    const existing = await this.mappingRepository.find({
      where: { userRole: { id: role.id } },
      relations: { permission: true },
    });

    const wanted = new Set(permissionIds);
    const keepActive = new Set<string>();

    for (const mapping of existing) {
      const permissionId = mapping.permission?.id;
      if (permissionId && wanted.has(permissionId)) {
        if (!mapping.active) {
          mapping.active = true;
          mapping.updatedBy = userId ?? null;
          await this.mappingRepository.save(mapping);
        }
        keepActive.add(permissionId);
        continue;
      }

      if (mapping.active) {
        mapping.active = false;
        mapping.updatedBy = userId ?? null;
        await this.mappingRepository.save(mapping);
      }
    }

    for (const permissionId of permissionIds) {
      if (keepActive.has(permissionId)) {
        continue;
      }

      await this.mappingRepository.save(
        this.mappingRepository.create({
          userRole: role,
          permission: { id: permissionId } as PermissionMaster,
          active: true,
          createdBy: userId ?? null,
          updatedBy: userId ?? null,
        }),
      );
    }

    return this.getById(role.id);
  }

  async listPermissions(options?: { page?: number; limit?: number; q?: string }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(200, Math.max(1, options?.limit ?? 100));
    const q = options?.q?.trim();

    const qb = this.permissionRepository
      .createQueryBuilder('permission')
      .where('permission.active = :active', { active: true })
      .orderBy('permission.code', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyPermissionSearchFilter(qb, 'permission', q);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toPublicPermission(item)),
      total,
      page,
      limit,
    };
  }

  /**
   * Permissions currently assigned to a role (active mappings).
   */
  async listRolePermissions(
    roleId: string,
    options?: { page?: number; limit?: number; q?: string },
  ) {
    await this.requireActiveRole(roleId);

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.mappingRepository
      .createQueryBuilder('mapping')
      .innerJoinAndSelect('mapping.permission', 'permission')
      .where('mapping.active = :active', { active: true })
      .andWhere('mapping.userRoleId = :roleId', { roleId })
      .andWhere('permission.active = :permissionActive', {
        permissionActive: true,
      })
      .orderBy('permission.code', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyPermissionSearchFilter(qb, 'permission', q);

    const [mappings, total] = await qb.getManyAndCount();

    return {
      items: mappings.map((mapping) =>
        this.toPublicRolePermission(mapping.permission, mapping),
      ),
      total,
      page,
      limit,
    };
  }

  /**
   * Active permissions not yet assigned to this role (for the add dialog).
   */
  async listPermissionCandidates(
    roleId: string,
    options?: { page?: number; limit?: number; q?: string },
  ) {
    await this.requireActiveRole(roleId);

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.permissionRepository
      .createQueryBuilder('candidate')
      .where('candidate.active = :active', { active: true })
      .andWhere((subQb) => {
        const existsSql = subQb
          .subQuery()
          .select('1')
          .from(UserRolePermissionMapping, 'mapping')
          .where('mapping.permissionId = candidate.id')
          .andWhere('mapping.userRoleId = :roleId')
          .andWhere('mapping.active = :mappingActive')
          .getQuery();
        return `NOT EXISTS ${existsSql}`;
      })
      .setParameters({
        roleId,
        mappingActive: true,
      })
      .orderBy('candidate.code', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyPermissionSearchFilter(qb, 'candidate', q);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toPublicPermission(item)),
      total,
      page,
      limit,
    };
  }

  async addPermissions(
    roleId: string,
    dto: AddUserRolePermissionDto,
    actorId?: string,
  ) {
    const role = await this.requireActiveRole(roleId);
    const permissions = await this.permissionRepository.find({
      where: { id: In(dto.permissionIds), active: true },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('One or more permissions were not found');
    }

    const permissionsById = new Map(
      permissions.map((permission) => [permission.id, permission]),
    );
    const items: ReturnType<UserRoleService['toPublicRolePermission']>[] = [];

    for (const permissionId of dto.permissionIds) {
      const permission = permissionsById.get(permissionId);
      if (!permission) {
        throw new NotFoundException('Permission not found');
      }

      const existing = await this.mappingRepository.find({
        where: {
          permission: { id: permission.id },
          userRole: { id: role.id },
        },
        order: { createdDate: 'DESC' },
      });

      const active = existing.find((row) => row.active);
      if (active) {
        throw new ConflictException(
          `Permission ${permission.code} is already on this role`,
        );
      }

      const inactive = existing.find((row) => !row.active);
      if (inactive) {
        inactive.active = true;
        inactive.updatedBy = actorId ?? null;
        const saved = await this.mappingRepository.save(inactive);
        items.push(this.toPublicRolePermission(permission, saved));
        continue;
      }

      const created = await this.mappingRepository.save(
        this.mappingRepository.create({
          userRole: role,
          permission,
          active: true,
          createdBy: actorId ?? null,
          updatedBy: actorId ?? null,
        }),
      );
      items.push(this.toPublicRolePermission(permission, created));
    }

    return { items, added: items.length };
  }

  async removePermission(
    roleId: string,
    permissionId: string,
    actorId?: string,
  ) {
    await this.requireActiveRole(roleId);

    const mapping = await this.mappingRepository.findOne({
      where: {
        userRole: { id: roleId },
        permission: { id: permissionId },
        active: true,
      },
    });

    if (!mapping) {
      throw new NotFoundException('Permission is not on this role');
    }

    mapping.active = false;
    mapping.updatedBy = actorId ?? null;
    await this.mappingRepository.save(mapping);

    return { roleId, permissionId, removed: true };
  }

  /**
   * Modules the user may see in the UI.
   * Distinct modules from the user's active roles. `ALL_SYSTEM` returns every active module.
   */
  async listGrantedModules(userId: string) {
    const mappings = await this.moduleMappingRepository
      .createQueryBuilder('mapping')
      .innerJoinAndSelect('mapping.module', 'module')
      .leftJoinAndSelect('module.parentModule', 'parentModule')
      .innerJoin('mapping.userRole', 'role')
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
      .where('mapping.active = :active')
      .andWhere('module.active = :active')
      .andWhere('role.active = :active')
      .andWhere('role.deletedToken = :deletedToken')
      .setParameters({
        userId,
        active: true,
        deletedToken: ACTIVE_DELETED_TOKEN,
      })
      .getMany();

    const granted = new Map<string, ModuleMaster>();
    for (const mapping of mappings) {
      granted.set(mapping.module.id, mapping.module);
    }

    let modules = [...granted.values()];
    if (modules.some((module) => module.code === ALL_SYSTEM_MODULE_CODE)) {
      modules = await this.moduleRepository.find({
        where: { active: true },
        relations: { parentModule: true },
        order: { sequenceNo: 'ASC', name: 'ASC' },
      });
    } else {
      modules.sort((a, b) => {
        const sequence = (a.sequenceNo ?? 0) - (b.sequenceNo ?? 0);
        if (sequence !== 0) {
          return sequence;
        }
        return a.name.localeCompare(b.name);
      });
    }

    return {
      items: modules.map((module) => this.toPublicGrantedModule(module)),
    };
  }

  /**
   * Systems (modules) currently assigned to a role (active mappings).
   */
  async listRoleModules(
    roleId: string,
    options?: { page?: number; limit?: number; q?: string },
  ) {
    await this.requireActiveRole(roleId);

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.moduleMappingRepository
      .createQueryBuilder('mapping')
      .innerJoinAndSelect('mapping.module', 'module')
      .where('mapping.active = :active', { active: true })
      .andWhere('mapping.userRoleId = :roleId', { roleId })
      .andWhere('module.active = :moduleActive', { moduleActive: true })
      .orderBy('module.sequenceNo', 'ASC')
      .addOrderBy('module.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyModuleSearchFilter(qb, 'module', q);

    const [mappings, total] = await qb.getManyAndCount();

    return {
      items: mappings.map((mapping) =>
        this.toPublicRoleModule(mapping.module, mapping),
      ),
      total,
      page,
      limit,
    };
  }

  /**
   * Active systems not yet assigned to this role (for the add dialog).
   */
  async listModuleCandidates(
    roleId: string,
    options?: { page?: number; limit?: number; q?: string },
  ) {
    await this.requireActiveRole(roleId);

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.moduleRepository
      .createQueryBuilder('candidate')
      .where('candidate.active = :active', { active: true })
      .andWhere((subQb) => {
        const existsSql = subQb
          .subQuery()
          .select('1')
          .from(UserRoleModuleMapping, 'mapping')
          .where('mapping.moduleId = candidate.id')
          .andWhere('mapping.userRoleId = :roleId')
          .andWhere('mapping.active = :mappingActive')
          .getQuery();
        return `NOT EXISTS ${existsSql}`;
      })
      .setParameters({
        roleId,
        mappingActive: true,
      })
      .orderBy('candidate.sequenceNo', 'ASC')
      .addOrderBy('candidate.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyModuleSearchFilter(qb, 'candidate', q);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((item) => this.toPublicModule(item)),
      total,
      page,
      limit,
    };
  }

  async addModules(
    roleId: string,
    dto: AddUserRoleModuleDto,
    actorId?: string,
  ) {
    const role = await this.requireActiveRole(roleId);
    const modules = await this.moduleRepository.find({
      where: { id: In(dto.moduleIds), active: true },
    });

    if (modules.length !== dto.moduleIds.length) {
      throw new NotFoundException('One or more systems were not found');
    }

    const modulesById = new Map(modules.map((module) => [module.id, module]));
    const items: ReturnType<UserRoleService['toPublicRoleModule']>[] = [];

    for (const moduleId of dto.moduleIds) {
      const module = modulesById.get(moduleId);
      if (!module) {
        throw new NotFoundException('System not found');
      }

      const existing = await this.moduleMappingRepository.find({
        where: {
          module: { id: module.id },
          userRole: { id: role.id },
        },
        order: { createdDate: 'DESC' },
      });

      const active = existing.find((row) => row.active);
      if (active) {
        throw new ConflictException(
          `System ${module.code} is already on this role`,
        );
      }

      const inactive = existing.find((row) => !row.active);
      if (inactive) {
        inactive.active = true;
        inactive.updatedBy = actorId ?? null;
        const saved = await this.moduleMappingRepository.save(inactive);
        items.push(this.toPublicRoleModule(module, saved));
        continue;
      }

      const created = await this.moduleMappingRepository.save(
        this.moduleMappingRepository.create({
          userRole: role,
          module,
          active: true,
          createdBy: actorId ?? null,
          updatedBy: actorId ?? null,
        }),
      );
      items.push(this.toPublicRoleModule(module, created));
    }

    return { items, added: items.length };
  }

  async removeModule(roleId: string, moduleId: string, actorId?: string) {
    await this.requireActiveRole(roleId);

    const mapping = await this.moduleMappingRepository.findOne({
      where: {
        userRole: { id: roleId },
        module: { id: moduleId },
        active: true,
      },
    });

    if (!mapping) {
      throw new NotFoundException('System is not on this role');
    }

    mapping.active = false;
    mapping.updatedBy = actorId ?? null;
    await this.moduleMappingRepository.save(mapping);

    return { roleId, moduleId, removed: true };
  }

  /**
   * Users currently assigned to a role (`UserUserRoleMapping`, active).
   */
  async listUsers(
    roleId: string,
    options?: { page?: number; limit?: number; q?: string },
  ) {
    await this.requireActiveRole(roleId);

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.userRoleUserMappingRepository
      .createQueryBuilder('mapping')
      .innerJoinAndSelect('mapping.user', 'assignedUser')
      .where('mapping.active = :active', { active: true })
      .andWhere('mapping.deletedToken = :deletedToken', {
        deletedToken: ACTIVE_DELETED_TOKEN,
      })
      .andWhere('mapping.userRoleId = :roleId', { roleId })
      .andWhere('assignedUser.active = :userActive', { userActive: true })
      .orderBy('assignedUser.username', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyUserSearchFilter(qb, 'assignedUser', q);

    const [mappings, total] = await qb.getManyAndCount();

    return {
      items: mappings.map((mapping) =>
        this.toPublicRoleUser(mapping.user, mapping),
      ),
      total,
      page,
      limit,
    };
  }

  /**
   * Active users not yet assigned to this role (for the add dialog).
   */
  async listUserCandidates(
    roleId: string,
    options?: { page?: number; limit?: number; q?: string },
  ) {
    await this.requireActiveRole(roleId);

    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();

    const qb = this.userRepository
      .createQueryBuilder('candidate')
      .where('candidate.active = :active', { active: true })
      .andWhere((subQb) => {
        const existsSql = subQb
          .subQuery()
          .select('1')
          .from(UserUserRoleMapping, 'mapping')
          .where('mapping.userId = candidate.id')
          .andWhere('mapping.userRoleId = :roleId')
          .andWhere('mapping.active = :mappingActive')
          .andWhere('mapping.deletedToken = :deletedToken')
          .getQuery();
        return `NOT EXISTS ${existsSql}`;
      })
      .setParameters({
        roleId,
        mappingActive: true,
        deletedToken: ACTIVE_DELETED_TOKEN,
      })
      .orderBy('candidate.username', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    this.applyUserSearchFilter(qb, 'candidate', q);

    const [items, total] = await qb.getManyAndCount();

    return {
      items: items.map((user) => this.toPublicUserSummary(user)),
      total,
      page,
      limit,
    };
  }

  async addUsers(roleId: string, dto: AddUserRoleUserDto, actorId?: string) {
    const role = await this.requireActiveRole(roleId);
    const users = await this.userRepository.find({
      where: { id: In(dto.userIds), active: true },
    });

    if (users.length !== dto.userIds.length) {
      throw new NotFoundException('One or more users were not found');
    }

    const usersById = new Map(users.map((user) => [user.id, user]));
    const items: ReturnType<UserRoleService['toPublicRoleUser']>[] = [];

    for (const userId of dto.userIds) {
      const user = usersById.get(userId);
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const existing = await this.userRoleUserMappingRepository.find({
        where: {
          user: { id: user.id },
          userRole: { id: role.id },
        },
        order: { createdDate: 'DESC' },
      });

      const active = existing.find(
        (row) => row.active && row.deletedToken === ACTIVE_DELETED_TOKEN,
      );
      if (active) {
        throw new ConflictException(
          `User ${user.username} is already in this role`,
        );
      }

      const inactive = existing.find((row) => !row.active);
      if (inactive) {
        inactive.active = true;
        inactive.deletedToken = ACTIVE_DELETED_TOKEN;
        inactive.updatedBy = actorId ?? null;
        const saved = await this.userRoleUserMappingRepository.save(inactive);
        items.push(this.toPublicRoleUser(user, saved));
        continue;
      }

      const created = await this.userRoleUserMappingRepository.save(
        this.userRoleUserMappingRepository.create({
          user,
          userRole: role,
          deletedToken: ACTIVE_DELETED_TOKEN,
          active: true,
          createdBy: actorId ?? null,
          updatedBy: actorId ?? null,
        }),
      );
      items.push(this.toPublicRoleUser(user, created));
    }

    return { items, added: items.length };
  }

  async removeUser(roleId: string, userId: string, actorId?: string) {
    await this.requireActiveRole(roleId);

    const mapping = await this.userRoleUserMappingRepository.findOne({
      where: {
        userRole: { id: roleId },
        user: { id: userId },
        active: true,
        deletedToken: ACTIVE_DELETED_TOKEN,
      },
    });

    if (!mapping) {
      throw new NotFoundException('User is not in this role');
    }

    mapping.active = false;
    mapping.deletedToken = mapping.id;
    mapping.updatedBy = actorId ?? null;
    await this.userRoleUserMappingRepository.save(mapping);

    return { roleId, userId, removed: true };
  }

  private async requireActiveRole(id: string): Promise<UserRoleMaster> {
    const role = await this.userRoleRepository.findOne({
      where: {
        id,
        active: true,
        deletedToken: ACTIVE_DELETED_TOKEN,
      },
    });
    if (!role) {
      throw new NotFoundException('User role not found');
    }
    return role;
  }

  private async listActivePermissionsForRole(roleId: string) {
    const mappings = await this.mappingRepository.find({
      where: { userRole: { id: roleId }, active: true },
      relations: { permission: true },
    });

    return mappings
      .map((mapping) => mapping.permission)
      .filter((permission): permission is PermissionMaster =>
        Boolean(permission?.active),
      )
      .sort((a, b) => a.code.localeCompare(b.code));
  }

  private async assertUniqueNameCode(
    name: string,
    code: string,
    excludeId?: string,
  ) {
    const nameClash = await this.userRoleRepository.findOne({
      where: {
        name,
        deletedToken: ACTIVE_DELETED_TOKEN,
        active: true,
      },
    });
    if (nameClash && nameClash.id !== excludeId) {
      throw new ConflictException(`User role name already exists: ${name}`);
    }

    const codeClash = await this.userRoleRepository.findOne({
      where: {
        code,
        deletedToken: ACTIVE_DELETED_TOKEN,
        active: true,
      },
    });
    if (codeClash && codeClash.id !== excludeId) {
      throw new ConflictException(`User role code already exists: ${code}`);
    }
  }

  private normalizeCode(raw: string): string {
    const code = raw.trim().toUpperCase();
    if (!ROLE_CODE_PATTERN.test(code)) {
      throw new BadRequestException(
        'code must match /^[A-Z0-9_]+$/ (letters, digits, underscore)',
      );
    }
    if (code.length > 64) {
      throw new BadRequestException('code must be at most 64 characters');
    }
    return code;
  }

  private async resolveActors(
    roles: readonly UserRoleMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        roles
          .flatMap((role) => [role.createdBy, role.updatedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const map = new Map<string, PublicActor>();
    if (ids.length === 0) {
      return map;
    }

    const users = await this.userRepository.find({
      where: { id: In(ids) },
    });

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

  private toPublicRole(
    role: UserRoleMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: role.id,
      name: role.name,
      code: role.code,
      description: role.description ?? null,
      createdDate: role.createdDate,
      updatedDate: role.updatedDate,
      createdBy: role.createdBy
        ? (actors.get(role.createdBy) ?? {
            id: role.createdBy,
            name: role.createdBy,
          })
        : null,
      updatedBy: role.updatedBy
        ? (actors.get(role.updatedBy) ?? {
            id: role.updatedBy,
            name: role.updatedBy,
          })
        : null,
    };
  }

  private toPublicPermission(permission: PermissionMaster) {
    return {
      id: permission.id,
      name: permission.name,
      code: permission.code,
      subject: permission.subject,
      action: permission.action,
      description: permission.description ?? null,
    };
  }

  private toPublicRolePermission(
    permission: PermissionMaster,
    mapping: UserRolePermissionMapping,
  ) {
    return {
      ...this.toPublicPermission(permission),
      mappingId: mapping.id,
      assignedDate: mapping.createdDate,
    };
  }

  private toPublicModule(module: ModuleMaster) {
    return {
      id: module.id,
      name: module.name,
      code: module.code,
      description: module.description ?? null,
      sequenceNo: module.sequenceNo ?? null,
      isGroup: module.isGroup,
    };
  }

  private toPublicGrantedModule(module: ModuleMaster) {
    return {
      ...this.toPublicModule(module),
      parentModuleId: module.parentModule?.id ?? null,
      parentModuleCode: module.parentModule?.code ?? null,
    };
  }

  private toPublicRoleModule(
    module: ModuleMaster,
    mapping: UserRoleModuleMapping,
  ) {
    return {
      ...this.toPublicModule(module),
      mappingId: mapping.id,
      assignedDate: mapping.createdDate,
    };
  }

  private toPublicUserSummary(user: UserMaster) {
    const fullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();
    return {
      id: user.id,
      username: user.username,
      email: user.email ?? null,
      displayName: fullName || user.username,
      role: user.role,
    };
  }

  private toPublicRoleUser(user: UserMaster, mapping: UserUserRoleMapping) {
    return {
      ...this.toPublicUserSummary(user),
      mappingId: mapping.id,
      assignedDate: mapping.createdDate,
    };
  }

  /**
   * Bound ILIKE search on user fields. Values are parameterized; `%` / `_`
   * in input are escaped so they are treated as literals.
   * `alias` must be a fixed query-builder alias (never user input).
   */
  private applyUserSearchFilter(
    qb: SelectQueryBuilder<ObjectLiteral>,
    alias: 'assignedUser' | 'candidate',
    q?: string,
  ) {
    if (!q) {
      return;
    }

    qb.andWhere(
      `(${alias}.username ILIKE :userSearch ESCAPE '\\'
        OR COALESCE(${alias}.email, '') ILIKE :userSearch ESCAPE '\\'
        OR COALESCE(${alias}.firstName, '') ILIKE :userSearch ESCAPE '\\'
        OR COALESCE(${alias}.lastName, '') ILIKE :userSearch ESCAPE '\\')`,
      { userSearch: this.toIlikeContainsPattern(q) },
    );
  }

  /**
   * Bound ILIKE search on permission fields.
   * `alias` must be a fixed query-builder alias (never user input).
   */
  private applyPermissionSearchFilter(
    qb: SelectQueryBuilder<ObjectLiteral>,
    alias: 'permission' | 'candidate',
    q?: string,
  ) {
    if (!q) {
      return;
    }

    qb.andWhere(
      `(${alias}.name ILIKE :permissionSearch ESCAPE '\\'
        OR ${alias}.code ILIKE :permissionSearch ESCAPE '\\'
        OR ${alias}.subject ILIKE :permissionSearch ESCAPE '\\'
        OR ${alias}.action ILIKE :permissionSearch ESCAPE '\\'
        OR COALESCE(${alias}.description, '') ILIKE :permissionSearch ESCAPE '\\')`,
      { permissionSearch: this.toIlikeContainsPattern(q) },
    );
  }

  /**
   * Bound ILIKE search on module/system fields.
   * `alias` must be a fixed query-builder alias (never user input).
   */
  private applyModuleSearchFilter(
    qb: SelectQueryBuilder<ObjectLiteral>,
    alias: 'module' | 'candidate',
    q?: string,
  ) {
    if (!q) {
      return;
    }

    qb.andWhere(
      `(${alias}.name ILIKE :moduleSearch ESCAPE '\\'
        OR ${alias}.code ILIKE :moduleSearch ESCAPE '\\'
        OR COALESCE(${alias}.description, '') ILIKE :moduleSearch ESCAPE '\\')`,
      { moduleSearch: this.toIlikeContainsPattern(q) },
    );
  }

  private toIlikeContainsPattern(raw: string): string {
    const escaped = raw
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
    return `%${escaped}%`;
  }
}
