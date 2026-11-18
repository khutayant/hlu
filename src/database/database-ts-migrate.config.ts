import { DataSource } from 'typeorm';
import {
  DATABASE_MIGRATION_TABLE_NAME,
  DatabaseConfig,
} from './database.config';

const migrations = ['migrations/**/*.ts'];

export default new DataSource({
  ...DatabaseConfig,
  migrations,
  migrationsTableName: DATABASE_MIGRATION_TABLE_NAME,
});
