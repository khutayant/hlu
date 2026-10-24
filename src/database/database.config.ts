import { DataSource, type DataSourceOptions } from 'typeorm';
import { AppEnv } from '../resources/env/app.env.js';

export const DATABASE_CONNECTION = 'default';
export const DATABASE_MIGRATION_TABLE_NAME = 'database_migration';

const entities = ['dist/src/entities/**/*.entity.js'];
const migrations = ['dist/migrations/**/*.js'];

export const DatabaseConfig: DataSourceOptions = {
  type: 'postgres',
  url: AppEnv.DATABASE_URL,
  entities,
  migrations,
  migrationsTableName: DATABASE_MIGRATION_TABLE_NAME,
  synchronize: false,
};

export default new DataSource(DatabaseConfig);
