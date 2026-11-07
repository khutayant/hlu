import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { join } from 'path';
import { DataSource, type EntityManager, type EntityMetadata } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import {
  loadSeedDocuments,
  toEntityKey,
  type SeedDocument,
} from './tools/seed-file.tool.js';

const UPDATE_SKIP = new Set(['id', 'code', 'createdDate', 'createdBy']);

type SeedColumn = EntityMetadata['columns'][number];

type SeedCounts = {
  files: number;
  inserted: number;
  updated: number;
  ignored: number;
};

/**
 * On startup, apply JSON files under `res/seed/<entity>/`.
 *
 * - `*.upsert.json` — insert, or update when `code` conflicts with its unique constraint
 * - `*.insert.json` — insert only; unique conflicts are ignored
 */
@Injectable()
export class DataSeedingEngineService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DataSeedingEngineService.name);
  private readonly seedDir = join(process.cwd(), 'res', 'seed');

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.seed();
  }

  async seed(): Promise<void> {
    const { documents, skippedEmpty } = await loadSeedDocuments(this.seedDir);
    for (const relativePath of skippedEmpty) {
      this.logger.warn(`Skipping seed file with no rows: ${relativePath}`);
    }
    if (documents.length === 0) {
      this.logger.log(
        'Data seed complete: files=0 inserted=0 updated=0 ignored=0',
      );
      return;
    }

    const entities = this.entityByKey();
    const counts: SeedCounts = {
      files: documents.length,
      inserted: 0,
      updated: 0,
      ignored: 0,
    };
    const checkedUnique = new Set<string>();

    await this.dataSource.transaction(async (manager) => {
      for (const document of documents) {
        const meta = entities.get(document.entityKey);
        if (!meta) {
          throw new Error(
            `${document.relativePath}: no entity matches "${document.entityKey}"`,
          );
        }

        if (document.mode === 'upsert' && !checkedUnique.has(meta.tableName)) {
          const conflictColumns = this.resolveUpsertConflictColumns(
            meta,
            document.relativePath,
          );
          await this.assertDatabaseUpsertConflict(
            manager,
            meta.tableName,
            conflictColumns,
          );
          checkedUnique.add(meta.tableName);
        }

        const fileCounts = await this.applyDocument(manager, meta, document);
        counts.inserted += fileCounts.inserted;
        counts.updated += fileCounts.updated;
        counts.ignored += fileCounts.ignored;
        this.logger.log(
          `Data seed ${document.relativePath}: inserted=${fileCounts.inserted} updated=${fileCounts.updated} ignored=${fileCounts.ignored}`,
        );
      }
    });

    this.logger.log(
      `Data seed complete: files=${counts.files} inserted=${counts.inserted} updated=${counts.updated} ignored=${counts.ignored}`,
    );
  }

  private entityByKey(): Map<string, EntityMetadata> {
    const map = new Map<string, EntityMetadata>();
    const add = (key: string, meta: EntityMetadata) => {
      const existing = map.get(key);
      if (existing && existing !== meta) {
        throw new Error(
          `Seed entity key "${key}" matches both ${existing.name} and ${meta.name}`,
        );
      }
      map.set(key, meta);
    };

    for (const meta of this.dataSource.entityMetadatas) {
      add(toEntityKey(meta.name), meta);
      add(toEntityKey(meta.tableName), meta);
    }
    return map;
  }

  private async applyDocument(
    manager: EntityManager,
    meta: EntityMetadata,
    document: SeedDocument,
  ): Promise<Pick<SeedCounts, 'inserted' | 'updated' | 'ignored'>> {
    const counts = { inserted: 0, updated: 0, ignored: 0 };

    for (const [index, row] of document.rows.entries()) {
      const where = `${document.relativePath} row ${index}`;
      try {
        const outcome = await this.applyRow(manager, meta, document, row);
        counts[outcome] += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${where}: ${message}`, { cause: error });
      }
    }

    return counts;
  }

  private async applyRow(
    manager: EntityManager,
    meta: EntityMetadata,
    document: SeedDocument,
    row: Record<string, unknown>,
  ): Promise<'inserted' | 'updated' | 'ignored'> {
    const values = await this.bindRow(manager, meta, document, row);
    const columns = meta.columns
      .map((column) => column.databaseName)
      .filter((name) => values.has(name));
    const params = columns.map((name) => values.get(name));
    const columnSql = columns.map((name) => this.escape(name)).join(', ');
    const valueSql = columns.map((_, index) => `$${index + 1}`).join(', ');
    const table = this.escape(meta.tableName);

    if (document.mode === 'insert') {
      const inserted = await manager.query(
        `INSERT INTO ${table} (${columnSql}) VALUES (${valueSql}) ON CONFLICT DO NOTHING RETURNING "id"`,
        params,
      );
      return Array.isArray(inserted) && inserted.length > 0
        ? 'inserted'
        : 'ignored';
    }

    const assignments = columns
      .filter((name) => !UPDATE_SKIP.has(name) && name !== 'updatedDate')
      .map((name) => `${this.escape(name)} = EXCLUDED.${this.escape(name)}`);
    if (meta.columns.some((column) => column.databaseName === 'updatedDate')) {
      assignments.push(`${this.escape('updatedDate')} = now()`);
    }

    const conflictAction =
      assignments.length > 0
        ? `DO UPDATE SET ${assignments.join(', ')}`
        : 'DO NOTHING';
    const returning =
      assignments.length > 0
        ? 'RETURNING (xmax = 0) AS inserted'
        : 'RETURNING "id"';

    const conflictColumns = this.resolveUpsertConflictColumns(
      meta,
      document.relativePath,
    );
    const conflictSql = conflictColumns
      .map((name) => this.escape(name))
      .join(', ');

    const result = await manager.query(
      `INSERT INTO ${table} (${columnSql}) VALUES (${valueSql}) ON CONFLICT (${conflictSql}) ${conflictAction} ${returning}`,
      params,
    );

    if (!Array.isArray(result) || result.length === 0) {
      return 'ignored';
    }
    if (assignments.length === 0) {
      return 'inserted';
    }
    // Postgres: xmax = 0 on the returned row means the insert won the conflict check.
    const inserted = result[0]?.inserted;
    return inserted === true || inserted === 't' ? 'inserted' : 'updated';
  }

  private async bindRow(
    manager: EntityManager,
    meta: EntityMetadata,
    document: SeedDocument,
    row: Record<string, unknown>,
  ): Promise<Map<string, unknown>> {
    const byName = new Map<string, SeedColumn>();
    for (const column of meta.columns) {
      byName.set(column.propertyName, column);
      byName.set(column.databaseName, column);
    }

    const values = new Map<string, unknown>();
    for (const [key, value] of Object.entries(row)) {
      const column = byName.get(key);
      if (!column) {
        throw new Error(`unknown field "${key}" on ${meta.name}`);
      }
      if (values.has(column.databaseName)) {
        throw new Error(`duplicate field for "${column.databaseName}"`);
      }
      if (column.relationMetadata && typeof value === 'string') {
        values.set(
          column.databaseName,
          await this.resolveCodeReference(manager, column, value.trim()),
        );
        continue;
      }
      this.assertScalar(key, value);
      values.set(column.databaseName, value);
    }

    if (document.mode === 'upsert') {
      const code = values.get('code');
      if (typeof code !== 'string' || !code.trim()) {
        throw new Error('code is required');
      }
      values.set('code', code.trim());

      const hasDeletedToken = meta.columns.some(
        (column) => column.databaseName === 'deletedToken',
      );
      if (hasDeletedToken && !values.has('deletedToken')) {
        values.set('deletedToken', 'NA');
      }
    } else if (typeof values.get('code') === 'string') {
      values.set('code', (values.get('code') as string).trim());
    }

    const id = values.get('id');
    if (id === undefined || id === null || id === '') {
      values.set('id', uuidv7());
    } else if (typeof id !== 'string') {
      throw new Error('id must be a string');
    }

    return values;
  }

  /** A relation field may hold the related row's `code`. The parent row must already exist. */
  private async resolveCodeReference(
    manager: EntityManager,
    column: SeedColumn,
    code: string,
  ): Promise<string> {
    if (!code) {
      throw new Error(`${column.propertyName} code is required`);
    }
    const target = column.relationMetadata?.inverseEntityMetadata;
    const codeColumn = target?.columns.find(
      (item) => item.databaseName === 'code' || item.propertyName === 'code',
    );
    const idColumn = target?.primaryColumns[0];
    if (!target || !codeColumn || !idColumn) {
      throw new Error(
        `${column.propertyName} cannot be resolved by code`,
      );
    }

    const rows: Array<{ id: string }> = await manager.query(
      `SELECT ${this.escape(idColumn.databaseName)} AS id FROM ${this.escape(target.tableName)} WHERE ${this.escape(codeColumn.databaseName)} = $1 LIMIT 1`,
      [code],
    );
    const id = rows[0]?.id;
    if (!id) {
      throw new Error(`${column.propertyName} "${code}" was not found`);
    }
    return id;
  }

  private assertScalar(key: string, value: unknown): void {
    if (
      value !== null &&
      typeof value !== 'string' &&
      typeof value !== 'number' &&
      typeof value !== 'boolean'
    ) {
      throw new Error(
        `field "${key}" must be a string, number, boolean, or null`,
      );
    }
  }

  /**
   * Upsert conflict target: `UNIQUE (code)` or soft-delete
   * `UNIQUE (code, deletedToken)`.
   */
  private resolveUpsertConflictColumns(
    meta: EntityMetadata,
    relativePath: string,
  ): string[] {
    const hasCode = meta.columns.some(
      (column) =>
        column.databaseName === 'code' || column.propertyName === 'code',
    );
    if (!hasCode) {
      throw new Error(`${relativePath}: ${meta.name} has no "code" column`);
    }

    const uniqueSets = [
      ...meta.uniques.map((unique) =>
        unique.columns.map((column) => column.databaseName),
      ),
      ...meta.indices
        .filter((index) => index.isUnique)
        .map((index) => index.columns.map((column) => column.databaseName)),
    ];

    const codeOnly = uniqueSets.find(
      (columns) => columns.length === 1 && columns[0] === 'code',
    );
    if (codeOnly) {
      return codeOnly;
    }

    const codeDeleted = uniqueSets.find(
      (columns) =>
        columns.length === 2 &&
        columns.includes('code') &&
        columns.includes('deletedToken'),
    );
    if (codeDeleted) {
      return ['code', 'deletedToken'];
    }

    throw new Error(
      `${relativePath}: ${meta.name} needs UNIQUE (code) or UNIQUE (code, deletedToken)`,
    );
  }

  private async assertDatabaseUpsertConflict(
    manager: EntityManager,
    tableName: string,
    conflictColumns: string[],
  ): Promise<void> {
    const rows: Array<{ def: string }> = await manager.query(
      `SELECT pg_get_constraintdef(c.oid) AS def
       FROM pg_constraint c
       JOIN pg_class t ON t.oid = c.conrelid
       JOIN pg_namespace n ON n.oid = t.relnamespace
       WHERE t.relname = $1
         AND n.nspname = current_schema()
         AND c.contype = 'u'`,
      [tableName],
    );
    const ready = rows.some((row) =>
      this.uniqueConstraintMatches(row.def, conflictColumns),
    );
    if (!ready) {
      const expected = `UNIQUE (${conflictColumns.join(', ')})`;
      throw new Error(
        `${tableName} has no ${expected} constraint. Run migrations before seeding .upsert.json files.`,
      );
    }
  }

  /**
   * Match `UNIQUE (...)` from `pg_get_constraintdef`, which may quote
   * camelCase columns (e.g. `UNIQUE (code, "deletedToken")`).
   */
  private uniqueConstraintMatches(
    def: string,
    conflictColumns: string[],
  ): boolean {
    const match = /^UNIQUE\s*\((.+)\)$/i.exec(def.trim());
    if (!match?.[1]) {
      return false;
    }
    const actual = match[1]
      .split(',')
      .map((part) => part.trim().replaceAll('"', ''))
      .filter(Boolean);
    if (actual.length !== conflictColumns.length) {
      return false;
    }
    return conflictColumns.every((column) => actual.includes(column));
  }

  private escape(name: string): string {
    return this.dataSource.driver.escape(name);
  }
}
