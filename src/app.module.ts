import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseConfig } from './database/database.config.js';

@Module({
  imports: [TypeOrmModule.forRoot(DatabaseConfig)],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
