import { MeetingAttendanceInfo } from '@app/entity/entities/info/meeting-attendance-info.entity';
import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingAttendanceController } from './meeting-attendance.controller';
import { MeetingAttendanceService } from './meeting-attendance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingAttendanceInfo,
      MeetingMaster,
      EmployeeMaster,
      UserMaster,
    ]),
  ],
  controllers: [MeetingAttendanceController],
  providers: [MeetingAttendanceService],
  exports: [MeetingAttendanceService],
})
export class MeetingAttendanceModule {}
