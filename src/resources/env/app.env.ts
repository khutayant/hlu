import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { isAbsolute, join, resolve } from 'path';
import { validateEnv } from '../../tools/validate-env.tool.js';
import type { AppEnvDto } from './app-env.dto.js';

config({ override: true });

const cwd = process.cwd();
const base = process.env.BASE || 'hlu';
const packageData = JSON.parse(
  readFileSync(join(cwd, 'package.json'), 'utf8'),
) as { version?: string };

function resolveDir(value: string | undefined, fallback: string) {
  const path = value?.trim() || fallback;
  return isAbsolute(path) ? path : resolve(cwd, path);
}

const storageDir = resolveDir(
  process.env.STORAGE_DIR,
  join(cwd, '..', 'dir'),
);
const tempDir = resolveDir(process.env.TEMP_DIR, join(storageDir, 'temps'));

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

  // storage
  STORAGE_DIR: storageDir,
  TEMP_DIR: tempDir,

  // keycloak
  KEYCLOAK_URL: (process.env.KEYCLOAK_URL ?? 'http://localhost:3100').replace(
    /\/$/,
    '',
  ),
  KEYCLOAK_REALM: process.env.KEYCLOAK_REALM ?? 'hlu',
  KEYCLOAK_CLIENT_ID: process.env.KEYCLOAK_CLIENT_ID ?? 'hlu-server',
  KEYCLOAK_CLIENT_SECRET: process.env.KEYCLOAK_CLIENT_SECRET!,
  KEYCLOAK_REDIRECT_URIS: (
    process.env.KEYCLOAK_REDIRECT_URIS ??
    'http://localhost:5192/ui/hluwork/auth/callback,http://localhost:5191/ui/hlu/auth/callback'
  )
    .split(',')
    .map((uri) => uri.trim())
    .filter(Boolean),

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

  SYSTEM_ADMIN_USERNAME: (process.env.SYSTEM_ADMIN_USERNAME ?? '').trim(),
};

validateEnv(AppEnv);
