import { PositionMaster } from '@app/entity/entities/master/position-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PositionController } from './position.controller';
import { PositionService } from './position.service';

@Module({
  imports: [TypeOrmModule.forFeature([PositionMaster, UserMaster])],
  controllers: [PositionController],
  providers: [PositionService],
  exports: [PositionService],
})
export class PositionModule {}
