import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add `title_master.code` and backfill from honorific names
 * (`title.atomic.csv` / seed codes).
 */
export class ManualGenerated1794978927154 implements MigrationInterface {
  name = 'ManualGenerated1794978927154';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "title_master"
      ADD COLUMN IF NOT EXISTS "code" character varying(64)
    `);

    await queryRunner.query(`
      UPDATE "title_master"
      SET "code" = CASE "name"
        WHEN 'Daw' THEN 'BURMESE_DAW'
        WHEN 'Dr.' THEN 'DOCTOR'
        WHEN 'Ko' THEN 'BURMESE_KO'
        WHEN 'Ma' THEN 'BURMESE_MA'
        WHEN 'Mg' THEN 'BURMESE_MG'
        WHEN 'Sayar' THEN 'BURMESE_SAYAR'
        WHEN 'U' THEN 'BURMESE_U'
        ELSE UPPER(REGEXP_REPLACE(REPLACE("name", '.', ''), '[^A-Za-z0-9]+', '_', 'g'))
      END
      WHERE "code" IS NULL OR TRIM("code") = ''
    `);

    await queryRunner.query(`
      ALTER TABLE "title_master"
      ALTER COLUMN "code" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'UQ_title_master_code'
        ) THEN
          ALTER TABLE "title_master"
          ADD CONSTRAINT "UQ_title_master_code" UNIQUE ("code");
        END IF;
      END $$
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM pg_constraint
          WHERE conname = 'CHK_title_master_code'
        ) THEN
          ALTER TABLE "title_master"
          ADD CONSTRAINT "CHK_title_master_code"
          CHECK ("code" ~ '^[A-Z0-9_]+$');
        END IF;
      END $$
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "title_master" DROP CONSTRAINT IF EXISTS "CHK_title_master_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "title_master" DROP CONSTRAINT IF EXISTS "UQ_title_master_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "title_master" DROP COLUMN IF EXISTS "code"
    `);
  }
}
