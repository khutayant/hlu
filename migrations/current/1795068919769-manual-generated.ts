import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Add meeting_allowance_master.sequenceNo and backfill per meeting
 * (createdDate ASC, name ASC).
 */
export class ManualGenerated1795068919769 implements MigrationInterface {
  name = 'ManualGenerated1795068919769';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meeting_allowance_master"
      ADD "sequenceNo" integer
    `);

    await queryRunner.query(`
      WITH ranked AS (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY "meetingId"
            ORDER BY "createdDate" ASC, name ASC, id ASC
          ) AS rn
        FROM "meeting_allowance_master"
      )
      UPDATE "meeting_allowance_master" AS allowance
      SET "sequenceNo" = ranked.rn
      FROM ranked
      WHERE allowance.id = ranked.id
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_allowance_master"
      ALTER COLUMN "sequenceNo" SET DEFAULT 1
    `);

    await queryRunner.query(`
      ALTER TABLE "meeting_allowance_master"
      ALTER COLUMN "sequenceNo" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "meeting_allowance_master"
      DROP COLUMN "sequenceNo"
    `);
  }
}
