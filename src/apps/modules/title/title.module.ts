import { TitleMaster } from '@app/entity/entities/master/title-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TitleController } from './title.controller';
import { TitleService } from './title.service';

@Module({
  imports: [TypeOrmModule.forFeature([TitleMaster, UserMaster])],
  controllers: [TitleController],
  providers: [TitleService],
  exports: [TitleService],
})
export class TitleModule {}
