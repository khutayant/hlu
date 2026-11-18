import { Injectable } from '@nestjs/common';
import { AppEnv } from './resources/env/app.env';

@Injectable()
export class AppService {
  getVersion() {
    return {
      version: AppEnv.APP_VERSION,
      name: AppEnv.NAME,
      env: AppEnv.APP_ENV,
    };
  }
}
