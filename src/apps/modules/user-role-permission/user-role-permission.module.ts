import { ModuleMaster } from '@app/entity/entities/master/module-master.entity';
import { PermissionMaster } from '@app/entity/entities/master/permission-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { UserRoleMaster } from '@app/entity/entities/master/user-role-master.entity';
import { UserRoleModuleMapping } from '@app/entity/entities/mapping/user-role-module-mapping.entity';
import { UserRolePermissionMapping } from '@app/entity/entities/mapping/user-role-permission-mapping.entity';
import { UserUserRoleMapping } from '@app/entity/entities/mapping/user-user-role-mapping.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRoleController } from './user-role.controller';
import { UserRoleService } from './user-role.service';

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
