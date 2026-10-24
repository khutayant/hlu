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
  DATABASE_URL: string;

  // allows
  ALLOW_ORIGINS: string[];
  ALLOW_METHODS: string[];
  ALLOW_HEADERS: string[];
};
