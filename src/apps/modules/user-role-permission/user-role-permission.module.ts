import {
  ModuleMaster,
  PermissionMaster,
  UserMaster,
  UserRoleMaster,
  UserRoleModuleMapping,
  UserRolePermissionMapping,
  UserUserRoleMapping,
} from '../../../../libs/entity/src/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoleController } from './user-role.controller.js';
import { UserRoleService } from './user-role.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRoleMaster,
      UserMaster,
      PermissionMaster,
      UserRolePermissionMapping,
      UserRoleModuleMapping,
      ModuleMaster,
      UserUserRoleMapping,
    ]),
  ],
  controllers: [UserRoleController],
  providers: [UserRoleService],
  exports: [UserRoleService],
})
export class UserRolePermissionModule {}
