import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingController } from './meeting.controller';
import { MeetingService } from './meeting.service';

@Module({
  imports: [TypeOrmModule.forFeature([MeetingMaster, UserMaster])],
  controllers: [MeetingController],
  providers: [MeetingService],
  exports: [MeetingService],
})
export class MeetingModule {}
