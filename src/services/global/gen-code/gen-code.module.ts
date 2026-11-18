import { CodeGenInfo } from '@app/entity/entities/info/code-gen-info.entity';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenCodeService } from './gen-code.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([CodeGenInfo])],
  providers: [GenCodeService],
  exports: [GenCodeService],
})
export class GenCodeModule {}
