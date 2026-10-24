import { DataSource } from 'typeorm';
import {
  DATABASE_MIGRATION_TABLE_NAME,
  DatabaseConfig,
} from './database.config.js';

const entities = ['src/entities/**/*.entity.ts'];
const migrations = ['migrations/**/*.ts'];

export default new DataSource({
  ...DatabaseConfig,
  entities,
  migrations,
  migrationsTableName: DATABASE_MIGRATION_TABLE_NAME,
});
