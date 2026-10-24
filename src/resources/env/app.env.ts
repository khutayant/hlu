import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { validateEnv } from '../../tools/validate-env.tool.js';
import type { AppEnvDto } from './app-env.dto.js';

config({ override: true });

const cwd = process.cwd();
const base = process.env.BASE || 'hlu';
const packageData = JSON.parse(
  readFileSync(join(cwd, 'package.json'), 'utf8'),
) as { version?: string };

export const AppEnv: AppEnvDto = {
  // app
  PORT: Number(process.env.PORT ?? 3300),
  NAME: process.env.NAME || 'Heartland Union',
  APP_ENV: process.env.APP_ENV || process.env.NODE_ENV || 'development',
  APP_VERSION: packageData.version ?? '0.0.0',

  // url
  CWD: cwd,
  BASE: base,
  UI_BASE_URL: `/ui/${base}/`,
  API_BASE_URL: `/api/${base}`,

  // database
  DATABASE_URL: process.env.DATABASE_URL!,

  // allows
  ALLOW_ORIGINS: (process.env.ALLOW_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ALLOW_METHODS: (process.env.ALLOW_METHODS ?? '')
    .split(',')
    .map((method) => method.trim()?.toUpperCase())
    .filter(Boolean),
  ALLOW_HEADERS: (process.env.ALLOW_HEADERS ?? '')
    .split(',')
    .map((header) => header.trim())
    .filter(Boolean),
};

validateEnv(AppEnv);
