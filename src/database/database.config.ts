import { DataSource, type DataSourceOptions } from 'typeorm';
import { AppEnv } from '../resources/env/app.env.js';

export const DATABASE_CONNECTION = 'default';
export const DATABASE_MIGRATION_TABLE_NAME = 'database_migration';

const entities = ['dist/src/entities/**/*.entity.js'];
const migrations = ['dist/migrations/**/*.js'];

export const DatabaseConfig: DataSourceOptions = {
  type: 'postgres',
  host: AppEnv.DATABASE_HOST,
  port: AppEnv.DATABASE_PORT,
  database: AppEnv.DATABASE_NAME,
  username: AppEnv.DATABASE_USERNAME,
  password: AppEnv.DATABASE_PASSWORD,
  entities,
  migrations,
  migrationsTableName: DATABASE_MIGRATION_TABLE_NAME,
  synchronize: false,
};

export default new DataSource(DatabaseConfig);
