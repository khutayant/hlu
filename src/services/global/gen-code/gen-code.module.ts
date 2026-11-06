import { CodeGenInfo } from '../../../../libs/entity/src/index.js';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenCodeService } from './gen-code.service.js';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CodeGenInfo])],
  providers: [GenCodeService],
  exports: [GenCodeService],
})
export class GenCodeModule {}
