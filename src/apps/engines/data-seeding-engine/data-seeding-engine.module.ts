import { Module } from '@nestjs/common';
import { DataSeedingEngineService } from './data-seeding-engine.service.js';

/** Startup loader for `res/seed/*.upsert.json` and `res/seed/*.insert.json`. */
@Module({
  providers: [DataSeedingEngineService],
})
export class DataSeedingEngineModule {}
