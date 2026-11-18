import { CountryMaster } from '@app/entity/entities/master/country-master.entity';
import { TownshipMaster } from '@app/entity/entities/master/township-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TownshipController } from './township.controller';
import { TownshipService } from './township.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TownshipMaster, CountryMaster, UserMaster]),
  ],
  controllers: [TownshipController],
  providers: [TownshipService],
  exports: [TownshipService],
})
export class TownshipModule {}
