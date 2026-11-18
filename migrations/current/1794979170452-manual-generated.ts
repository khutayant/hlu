import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Replace `employee_master.townshipName` with FK `townshipId` → `township_master`.
 * Backfill by township **code** (via legacy name→code map), then focalPrefix.
 * Data-only re-link script: `local-data/employee-list/employee-township.sql` (code-based).
 */
export class ManualGenerated1794979170452 implements MigrationInterface {
  name = 'ManualGenerated1794979170452';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ADD COLUMN IF NOT EXISTS "townshipId" uuid
    `);

    await queryRunner.query(`
      UPDATE "employee_master" e
      SET "townshipId" = t.id
      FROM "township_master" t
      WHERE e."townshipId" IS NULL
        AND e."townshipName" IS NOT NULL
        AND TRIM(e."townshipName") <> ''
        AND t.code = CASE TRIM(e."townshipName")
          WHEN 'Gangaw North' THEN 'GANGAW_NORTH'
          WHEN 'Gangaw South' THEN 'GANGAW_SOUTH'
          WHEN 'Myaing' THEN 'MYAING'
          WHEN 'Pauk' THEN 'PAUK'
          WHEN 'Saw' THEN 'SAW'
          WHEN 'Tilin' THEN 'TILIN'
          WHEN 'Yesagyo' THEN 'YESAGYO'
          ELSE NULL
        END
        AND t.active = true
    `);

    await queryRunner.query(`
      UPDATE "employee_master" e
      SET "townshipId" = t.id
      FROM "township_master" t
      WHERE e."townshipId" IS NULL
        AND e."focalNo" IS NOT NULL
        AND t."focalPrefix" <> ''
        AND e."focalNo" LIKE (t."focalPrefix" || '%')
        AND t.active = true
        AND NOT EXISTS (
          SELECT 1
          FROM "township_master" t2
          WHERE t2.active = true
            AND t2."focalPrefix" <> ''
            AND e."focalNo" LIKE (t2."focalPrefix" || '%')
            AND LENGTH(t2."focalPrefix") > LENGTH(t."focalPrefix")
        )
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ALTER COLUMN "townshipId" SET NOT NULL
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FK_employee_master_township'
        ) THEN
          ALTER TABLE "employee_master"
          ADD CONSTRAINT "FK_employee_master_township"
          FOREIGN KEY ("townshipId") REFERENCES "township_master"("id")
          ON DELETE NO ACTION ON UPDATE NO ACTION;
        END IF;
      END $$
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      DROP COLUMN IF EXISTS "townshipName"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ADD COLUMN IF NOT EXISTS "townshipName" character varying(255)
    `);

    await queryRunner.query(`
      UPDATE "employee_master" e
      SET "townshipName" = t.name
      FROM "township_master" t
      WHERE t.id = e."townshipId"
        AND (e."townshipName" IS NULL OR TRIM(e."townshipName") = '')
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ALTER COLUMN "townshipName" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      DROP CONSTRAINT IF EXISTS "FK_employee_master_township"
    `);

    await queryRunner.query(`
      ALTER TABLE "employee_master"
      DROP COLUMN IF EXISTS "townshipId"
    `);
  }
}
