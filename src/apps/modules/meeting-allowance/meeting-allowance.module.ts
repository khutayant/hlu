import { MeetingAllowanceMaster } from '@app/entity/entities/master/meeting-allowance-master.entity';
import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MeetingAllowanceController } from './meeting-allowance.controller';
import { MeetingAllowanceService } from './meeting-allowance.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MeetingAllowanceMaster,
      MeetingMaster,
      UserMaster,
    ]),
  ],
  controllers: [MeetingAllowanceController],
  providers: [MeetingAllowanceService],
  exports: [MeetingAllowanceService],
})
export class MeetingAllowanceModule {}
