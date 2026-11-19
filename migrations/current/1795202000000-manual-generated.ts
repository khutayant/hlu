import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Link position_master to optional category_master.
 */
export class ManualGenerated1795202000000 implements MigrationInterface {
  name = 'ManualGenerated1795202000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "position_master"
      ADD COLUMN "categoryId" uuid
    `);
    await queryRunner.query(`
      ALTER TABLE "position_master"
      ADD CONSTRAINT "FK_position_master_category"
      FOREIGN KEY ("categoryId") REFERENCES "category_master"("id")
      ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "position_master"
      DROP CONSTRAINT "FK_position_master_category"
    `);
    await queryRunner.query(`
      ALTER TABLE "position_master"
      DROP COLUMN "categoryId"
    `);
  }
}
