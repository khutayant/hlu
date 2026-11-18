import { ImmunizationSessionMaster } from '@app/entity/entities/master/immunization-session-master.entity';
import { ProjectMaster } from '@app/entity/entities/master/project-master.entity';
import { TownshipMaster } from '@app/entity/entities/master/township-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImmunizationSessionController } from './immunization-session.controller';
import { ImmunizationSessionService } from './immunization-session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImmunizationSessionMaster,
      ProjectMaster,
      TownshipMaster,
      UserMaster,
    ]),
  ],
  controllers: [ImmunizationSessionController],
  providers: [ImmunizationSessionService],
  exports: [ImmunizationSessionService],
})
export class ImmunizationSessionModule {}
