import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import { EmployeeSignatureMaster } from '@app/entity/entities/master/employee-signature-master.entity';
import { PositionMaster } from '@app/entity/entities/master/position-master.entity';
import { TitleMaster } from '@app/entity/entities/master/title-master.entity';
import { TownshipMaster } from '@app/entity/entities/master/township-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenCodeModule } from '../../../services/global/gen-code/gen-code.module';
import { FileModule } from '../file/file.module';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeMaster,
      EmployeeSignatureMaster,
      UserMaster,
      TitleMaster,
      PositionMaster,
      TownshipMaster,
    ]),
    GenCodeModule,
    FileModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}