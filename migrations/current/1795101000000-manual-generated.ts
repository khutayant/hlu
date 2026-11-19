import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Head-office employees have no township — make employee.townshipId optional.
 */
export class ManualGenerated1795101000000 implements MigrationInterface {
  name = 'ManualGenerated1795101000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ALTER COLUMN "townshipId" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "employee_master"
      ALTER COLUMN "townshipId" SET NOT NULL
    `);
  }
}
