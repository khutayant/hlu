import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManualGenerated1795053713787 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" ADD "showTotalOnly" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" DROP COLUMN "showUnitPrice"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" DROP COLUMN "showQuantity"`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" DROP COLUMN "showTotalAmount"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" ADD "showTotalAmount" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" ADD "showQuantity" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" ADD "showUnitPrice" boolean NOT NULL DEFAULT true`,
    );
    await queryRunner.query(
      `ALTER TABLE "meeting_allowance_master" DROP COLUMN "showTotalOnly"`,
    );
  }
}
