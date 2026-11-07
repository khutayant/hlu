import {
  ModuleMaster,
  PermissionMaster,
  UserRoleMaster,
  UserRoleModuleMapping,
  UserRolePermissionMapping,
} from '@app/entity';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiDecoratorCheckerService } from './api-decorator-checker.service.js';
import { AdminRelationshipSeedService } from './seed-admin/admin-relationship-seed.service.js';
import { PermissionSeedService } from './services/permission-seed.service.js';

/**
 * Dev `@ApiController` / `@Api*` checker + post-startup permission seed
 * (+ ADMIN relationship seed after permissions).
 */
@Module({
  imports: [
    DiscoveryModule,
    TypeOrmModule.forFeature([
      PermissionMaster,
      UserRoleMaster,
      ModuleMaster,
      UserRoleModuleMapping,
      UserRolePermissionMapping,
    ]),
  ],
  providers: [
    ApiDecoratorCheckerService,
    PermissionSeedService,
    AdminRelationshipSeedService,
  ],
  exports: [PermissionSeedService, AdminRelationshipSeedService],
})
export class ApiDecoratorCheckerModule {}
