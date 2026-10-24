import {
  Logger,
  RequestMethod,
  UnauthorizedException,
  VersioningType,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import dayjs from 'dayjs';
import { AppModule } from './app.module.js';
import { AppEnv } from './resources/env/app.env.js';

async function bootstrap() {
  const logger = new Logger('Main');

  process.on('uncaughtException', (error) => {
    logger.error(`UNCAUGHT_EXCEPTION: [Source=PROCESS]`, error);
  });
  process.on('unhandledRejection', (error) => {
    logger.error(`UNHANDLED_REJECTION: [Source=PROCESS]`, error as Error);
  });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.set('trust proxy', 1);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const sameApplicationOrigin =
        origin === `http://localhost:${AppEnv.PORT}` ||
        origin === `http://127.0.0.1:${AppEnv.PORT}`;

      if (
        sameApplicationOrigin ||
        AppEnv.ALLOW_ORIGINS.includes('*') ||
        AppEnv.ALLOW_ORIGINS.includes(origin)
      ) {
        return callback(null, origin);
      }

      return callback(
        new UnauthorizedException(`Forbidden origin: ${origin}`),
        false,
      );
    },
    methods: AppEnv.ALLOW_METHODS,
    allowedHeaders: AppEnv.ALLOW_HEADERS,
    credentials: true,
  });

  const uiRoute = AppEnv.UI_BASE_URL.replace(/^\//, '');

  app.setGlobalPrefix(`/api/${AppEnv.BASE}`, {
    exclude: [
      { path: '', method: RequestMethod.GET },
      { path: uiRoute, method: RequestMethod.GET },
      { path: `${uiRoute}/*`, method: RequestMethod.GET },
      { path: 'health', method: RequestMethod.GET },
    ],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',
  });

  await app.listen(AppEnv.PORT);

  logger.log(`${'='.repeat(25)} ${AppEnv.NAME} Started ${'='.repeat(25)}`);
  logger.log(`${'Name:'.padEnd(20)} ${AppEnv.NAME}`);
  logger.log(`${'Base:'.padEnd(20)} ${AppEnv.BASE}`);
  logger.log(`${'Port:'.padEnd(20)} ${AppEnv.PORT}`);
  logger.log(`${'Version:'.padEnd(20)} ${AppEnv.APP_VERSION}`);
  logger.log(`${'Env:'.padEnd(20)} ${AppEnv.APP_ENV}`);
  logger.log(`${'UI:'.padEnd(20)} ${AppEnv.UI_BASE_URL}`);
  logger.log(`${'API:'.padEnd(20)} ${AppEnv.API_BASE_URL}`);
  logger.log(`${'Allow Origins:'.padEnd(20)}`);
  AppEnv.ALLOW_ORIGINS.forEach((origin) => {
    logger.log(`${''.padEnd(20)} ${origin}`);
  });
  logger.log(
    `${'Allow Methods:'.padEnd(20)} ${AppEnv.ALLOW_METHODS.join(', ')}`,
  );
  logger.log(
    `${'Allow Headers:'.padEnd(20)} ${AppEnv.ALLOW_HEADERS.join(', ')}`,
  );
  logger.log(
    `${'Started At:'.padEnd(20)} ${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
  );
  logger.log(`${'='.repeat(25)} ${AppEnv.NAME} Started ${'='.repeat(25)}`);
}

void bootstrap();
