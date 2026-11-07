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

  // storage
  STORAGE_DIR: string;
  TEMP_DIR: string;

  // keycloak
  KEYCLOAK_URL: string;
  KEYCLOAK_REALM: string;
  KEYCLOAK_CLIENT_ID: string;
  KEYCLOAK_CLIENT_SECRET: string;
  KEYCLOAK_REDIRECT_URIS: string[];

  // allows
  ALLOW_ORIGINS: string[];
  ALLOW_METHODS: string[];
  ALLOW_HEADERS: string[];

  /** Keycloak username that is assigned the ADMIN user role on login. */
  SYSTEM_ADMIN_USERNAME: string;
};
