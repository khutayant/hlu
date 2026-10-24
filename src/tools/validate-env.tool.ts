import type { AppEnvDto } from '../resources/env/app-env.dto.js';

const REQUIRED_KEYS: (keyof AppEnvDto)[] = [
  'NAME',
  'PORT',
  'BASE',
  'DATABASE_URL',
];

export function validateEnv(env: AppEnvDto) {
  const missing = REQUIRED_KEYS.filter((key) => {
    const value = env[key];
    return value === undefined || value === null || value === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. Copy .env-mock to .env and fill values.`,
    );
  }
}
