import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserMaster,
  UserRoleMaster,
  UserUserRoleMapping,
} from '../../../../libs/entity/src/index.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

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
