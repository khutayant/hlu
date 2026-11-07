import {
  BadRequestException,
  Body,
  HttpException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiController,
  ApiDelete,
  ApiGet,
  ApiPost,
  ApiPut,
} from '../../../decorators/api.decorator.js';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data.js';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool.js';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import type { AuthUser } from '../../../interfaces/auth-user.interface.js';
import { parseAddUserRoleModuleDto } from './dto/add-user-role-module.dto.js';
import { parseAddUserRolePermissionDto } from './dto/add-user-role-permission.dto.js';
import { parseAddUserRoleUserDto } from './dto/add-user-role-user.dto.js';
import { parseCreateUserRoleDto } from './dto/create-user-role.dto.js';
import { parseSetUserRolePermissionsDto } from './dto/set-user-role-permissions.dto.js';
import { parseUpdateUserRoleDto } from './dto/update-user-role.dto.js';
import { UserRoleService } from './user-role.service.js';

/**
 * User role API under `/api/{base}/v1/user-role`.
 *
 * Auth required (global guard).
 */
@ApiController({ code: 'USER_ROLE', args: 'user-role' })
export class UserRoleController {
  constructor(private readonly userRoleService: UserRoleService) {}

  /**
   * List active user roles.
   *
   * `GET /user-role?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_LIST',
    name: 'List user roles',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List user roles',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * List active permissions (for assigning to a role).
   *
   * `GET /user-role/permissions?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_PERMISSION_LIST',
    name: 'List permissions for roles',
    args: 'permissions',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List permissions available for user roles',
    }),
  })
  listPermissions(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listPermissions({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Modules the signed-in user may see, from their active roles.
   * `ALL_SYSTEM` expands to every active module.
   *
   * `GET /user-role/me/modules`
   */
  @ApiGet({
    code: 'USER_ROLE_GRANTED_MODULES',
    name: 'Granted modules for current user',
    args: 'me/modules',
    permission: null,
  })
  grantedModules(@CurrentUser() user: AuthUser) {
    return this.userRoleService.listGrantedModules(user.id);
  }

  /**
   * Get one user role with its permissions.
   *
   * `GET /user-role/:id`
   */
  @ApiGet({
    code: 'USER_ROLE_GET',
    name: 'Get user role',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.READ,
      description: 'Read a user role and its permissions',
    }),
  })
  getById(@Param('id') id: string) {
    return this.userRoleService.getById(id);
  }

  /**
   * Create a user role.
   *
   * `POST /user-role`
   * Body: `{ name, code, description? }`
   */
  @ApiPost({
    code: 'USER_ROLE_CREATE',
    name: 'Create user role',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a user role',
    }),
  })
  async create(@Body() body: unknown, @CurrentUser() user?: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateUserRoleDto(body));
    return this.userRoleService.create(dto, user?.id);
  }

  /**
   * Update a user role.
   *
   * `PUT /user-role/:id`
   * Body: `{ name?, code?, description? }`
   */
  @ApiPut({
    code: 'USER_ROLE_UPDATE',
    name: 'Update user role',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a user role',
    }),
  })
  async update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateUserRoleDto(body));
    return this.userRoleService.update(id, dto, user?.id);
  }

  /**
   * Soft-delete a user role.
   *
   * `DELETE /user-role/:id`
   */
  @ApiDelete({
    code: 'USER_ROLE_DELETE',
    name: 'Delete user role',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.DELETE,
      description: 'Soft-delete a user role',
    }),
  })
  softDelete(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.userRoleService.softDelete(id, user?.id);
  }

  /**
   * Replace permissions assigned to a user role.
   *
   * `PUT /user-role/:id/permissions`
   * Body: `{ permissionIds: string[] }`
   */
  @ApiPut({
    code: 'USER_ROLE_SET_PERMISSIONS',
    name: 'Set user role permissions',
    args: ':id/permissions',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Assign permissions to a user role',
    }),
  })
  async setPermissions(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseSetUserRolePermissionsDto(body),
    );
    return this.userRoleService.setPermissions(id, dto, user?.id);
  }

  /**
   * List permissions that can be added to a role.
   *
   * `GET /user-role/:id/permissions/candidates?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_PERMISSION_CANDIDATE_LIST',
    name: 'List role permission candidates',
    args: ':id/permissions/candidates',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List permissions available to add to a user role',
    }),
  })
  listPermissionCandidates(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listPermissionCandidates(id, {
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * List permissions assigned to a role.
   *
   * `GET /user-role/:id/permissions?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_ROLE_PERMISSION_LIST',
    name: 'List permissions on role',
    args: ':id/permissions',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List permissions assigned to a user role',
    }),
  })
  listRolePermissions(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listRolePermissions(id, {
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Add permissions to a role (batch, max 20).
   *
   * `POST /user-role/:id/permissions`
   * Body: `{ permissionIds: string[] }`
   */
  @ApiPost({
    code: 'USER_ROLE_PERMISSION_ADD',
    name: 'Add permissions to role',
    args: ':id/permissions',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Assign permissions to a user role',
    }),
  })
  async addPermissions(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseAddUserRolePermissionDto(body),
    );
    return this.userRoleService.addPermissions(id, dto, user?.id);
  }

  /**
   * Remove a permission from a role (soft-deactivate mapping).
   *
   * `DELETE /user-role/:id/permissions/:permissionId`
   */
  @ApiDelete({
    code: 'USER_ROLE_PERMISSION_REMOVE',
    name: 'Remove permission from role',
    args: ':id/permissions/:permissionId',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.DELETE,
      description: 'Remove a permission from a user role',
    }),
  })
  removePermission(
    @Param('id') id: string,
    @Param('permissionId') permissionId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.userRoleService.removePermission(id, permissionId, user?.id);
  }

  /**
   * List systems that can be added to a role.
   *
   * `GET /user-role/:id/modules/candidates?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_MODULE_CANDIDATE_LIST',
    name: 'List role system candidates',
    args: ':id/modules/candidates',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List systems available to add to a user role',
    }),
  })
  listModuleCandidates(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listModuleCandidates(id, {
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * List systems assigned to a role.
   *
   * `GET /user-role/:id/modules?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_MODULE_LIST',
    name: 'List systems on role',
    args: ':id/modules',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List systems assigned to a user role',
    }),
  })
  listModules(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listRoleModules(id, {
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Add systems to a role (batch, max 20).
   *
   * `POST /user-role/:id/modules`
   * Body: `{ moduleIds: string[] }`
   */
  @ApiPost({
    code: 'USER_ROLE_MODULE_ADD',
    name: 'Add systems to role',
    args: ':id/modules',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Assign systems to a user role',
    }),
  })
  async addModules(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseAddUserRoleModuleDto(body));
    return this.userRoleService.addModules(id, dto, user?.id);
  }

  /**
   * Remove a system from a role (soft-deactivate mapping).
   *
   * `DELETE /user-role/:id/modules/:moduleId`
   */
  @ApiDelete({
    code: 'USER_ROLE_MODULE_REMOVE',
    name: 'Remove system from role',
    args: ':id/modules/:moduleId',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.DELETE,
      description: 'Remove a system from a user role',
    }),
  })
  removeModule(
    @Param('id') id: string,
    @Param('moduleId') moduleId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.userRoleService.removeModule(id, moduleId, user?.id);
  }

  /**
   * List users that can be added to a role.
   *
   * `GET /user-role/:id/users/candidates?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_USER_CANDIDATE_LIST',
    name: 'List role user candidates',
    args: ':id/users/candidates',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List users available to add to a user role',
    }),
  })
  listUserCandidates(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listUserCandidates(id, {
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * List users assigned to a role.
   *
   * `GET /user-role/:id/users?q=&page=&limit=`
   */
  @ApiGet({
    code: 'USER_ROLE_USER_LIST',
    name: 'List users in role',
    args: ':id/users',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List users assigned to a user role',
    }),
  })
  listUsers(
    @Param('id') id: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.userRoleService.listUsers(id, {
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  /**
   * Add users to a role (batch, max 20).
   *
   * `POST /user-role/:id/users`
   * Body: `{ userIds: string[] }`
   */
  @ApiPost({
    code: 'USER_ROLE_USER_ADD',
    name: 'Add users to role',
    args: ':id/users',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Assign users to a user role',
    }),
  })
  async addUsers(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user?: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseAddUserRoleUserDto(body));
    return this.userRoleService.addUsers(id, dto, user?.id);
  }

  /**
   * Remove a user from a role (soft-delete mapping).
   *
   * `DELETE /user-role/:id/users/:userId`
   */
  @ApiDelete({
    code: 'USER_ROLE_USER_REMOVE',
    name: 'Remove user from role',
    args: ':id/users/:userId',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER_ROLE,
      action: PERMISSION_ACTION.DELETE,
      description: 'Remove a user from a user role',
    }),
  })
  removeUser(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.userRoleService.removeUser(id, userId, user?.id);
  }

  private parseOrBadRequest<T>(parse: () => T): T {
    try {
      return parse();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      if (error instanceof Error) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException('Invalid request');
    }
  }
}
