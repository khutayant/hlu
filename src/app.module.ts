import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './apps/auth/auth.module.js';
import { FileModule } from './apps/file/file.module.js';
import { DatabaseConfig } from './database/database.config.js';
import { GenCodeModule } from './services/global/gen-code/gen-code.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(DatabaseConfig),
    AuthModule,
    GenCodeModule,
    FileModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
