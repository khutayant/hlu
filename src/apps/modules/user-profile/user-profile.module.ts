import { UserMaster } from '../../../../libs/entity/src/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module.js';
import { UserProfileController } from './user-profile.controller.js';
import { UserProfileService } from './user-profile.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserMaster]), FileModule],
  controllers: [UserProfileController],
  providers: [UserProfileService],
  exports: [UserProfileService],
})
export class UserProfileModule {}
