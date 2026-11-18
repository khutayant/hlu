import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { UserRoleMaster } from '@app/entity/entities/master/user-role-master.entity';
import { UserUserRoleMapping } from '@app/entity/entities/mapping/user-user-role-mapping.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserMaster,
      UserRoleMaster,
      UserUserRoleMapping,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
