import { ModuleMaster } from '@app/entity/entities/master/module-master.entity';
import { PermissionMaster } from '@app/entity/entities/master/permission-master.entity';
import { UserRoleMaster } from '@app/entity/entities/master/user-role-master.entity';
import { UserRoleModuleMapping } from '@app/entity/entities/mapping/user-role-module-mapping.entity';
import { UserRolePermissionMapping } from '@app/entity/entities/mapping/user-role-permission-mapping.entity';
import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiDecoratorCheckerService } from './api-decorator-checker.service';
import { AdminRelationshipSeedService } from './seed-admin/admin-relationship-seed.service';
import { PermissionSeedService } from './services/permission-seed.service';

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
