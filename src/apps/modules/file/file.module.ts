import { CategoryMaster } from '@app/entity/entities/master/category-master.entity';
import { FileInfo } from '@app/entity/entities/info/file-info.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [TypeOrmModule.forFeature([FileInfo, CategoryMaster])],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
