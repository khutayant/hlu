import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Session numbers use the township focal prefix (`GN20260001`)
 * instead of a fixed `SEC` prefix. Existing `SEC…` values still match.
 */
export class ManualGenerated1795100000000 implements MigrationInterface {
  name = 'ManualGenerated1795100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      DECLARE
        constraint_name text;
      BEGIN
        SELECT con.conname INTO constraint_name
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'immunization_session_master'
          AND con.contype = 'c'
          AND pg_get_constraintdef(con.oid) LIKE '%sessionNo%';
        IF constraint_name IS NOT NULL THEN
          EXECUTE format(
            'ALTER TABLE "immunization_session_master" DROP CONSTRAINT %I',
            constraint_name
          );
        END IF;
      END $$
    `);
    await queryRunner.query(`
      ALTER TABLE "immunization_session_master"
      ADD CONSTRAINT "CHK_immunization_session_sessionNo"
      CHECK ("sessionNo" ~ '^[A-Z0-9]{1,5}[0-9]{8}$')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "immunization_session_master"
      DROP CONSTRAINT "CHK_immunization_session_sessionNo"
    `);
    await queryRunner.query(`
      ALTER TABLE "immunization_session_master"
      ADD CONSTRAINT "CHK_b2100f1ac488a54ba3ab49af1a"
      CHECK ("sessionNo" ~ '^SEC[0-9]{4}[0-9]{4}$')
    `);
  }
}
