import {
  CategoryMaster,
  FileInfo,
} from '../../../../libs/entity/src/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller.js';
import { FileService } from './file.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([FileInfo, CategoryMaster])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
