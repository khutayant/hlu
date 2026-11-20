import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import { EmployeeSignatureMaster } from '@app/entity/entities/master/employee-signature-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FileModule } from '../file/file.module';
import { EmployeeSignatureController } from './employee-signature.controller';
import { EmployeeSignatureService } from './employee-signature.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeSignatureMaster,
      EmployeeMaster,
      UserMaster,
    ]),
    FileModule,
  ],
  controllers: [EmployeeSignatureController],
  providers: [EmployeeSignatureService],
  exports: [EmployeeSignatureService],
})
export class EmployeeSignatureModule {}
