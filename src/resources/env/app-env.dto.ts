export type AppEnvDto = {
  // app
  PORT: number;
  NAME: string;
  APP_ENV: string;
  APP_VERSION: string;

  // url
  CWD: string;
  BASE: string;
  UI_BASE_URL: string;
  API_BASE_URL: string;

  // database
  DATABASE_HOST: string;
  DATABASE_PORT: number;
  DATABASE_NAME: string;
  DATABASE_USERNAME: string;
  DATABASE_PASSWORD: string;

  // allows
  ALLOW_ORIGINS: string[];
  ALLOW_METHODS: string[];
  ALLOW_HEADERS: string[];
};
