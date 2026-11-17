import {
  EmployeeMaster,
  UserMaster,
} from '../../../../libs/entity/src/index.js';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenCodeModule } from '../../../services/global/gen-code/gen-code.module.js';
import { FileModule } from '../file/file.module.js';
import { EmployeeController } from './employee.controller.js';
import { EmployeeService } from './employee.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeMaster, UserMaster]),
    GenCodeModule,
    FileModule,
  ],
  controllers: [EmployeeController],
  providers: [EmployeeService],
  exports: [EmployeeService],
})
export class EmployeeModule {}
