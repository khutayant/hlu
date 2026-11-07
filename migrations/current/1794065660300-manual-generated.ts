import { MigrationInterface, QueryRunner } from 'typeorm';

export class ManualGenerated1794065660300 implements MigrationInterface {
  name = 'ManualGenerated1794065660300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "user_role_module_mapping" ("createdDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "createdBy" uuid, "updatedDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedBy" uuid, "active" boolean NOT NULL DEFAULT true, "id" uuid NOT NULL, "remark" character varying(256), "userRoleId" uuid NOT NULL, "moduleId" uuid NOT NULL, CONSTRAINT "PK_user_role_module_mapping" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role_module_mapping" ADD CONSTRAINT "FK_user_role_module_mapping_user_role" FOREIGN KEY ("userRoleId") REFERENCES "user_role_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role_module_mapping" ADD CONSTRAINT "FK_user_role_module_mapping_module" FOREIGN KEY ("moduleId") REFERENCES "module_master"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "user_role_module_mapping" DROP CONSTRAINT "FK_user_role_module_mapping_module"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_role_module_mapping" DROP CONSTRAINT "FK_user_role_module_mapping_user_role"`,
    );
    await queryRunner.query(`DROP TABLE "user_role_module_mapping"`);
  }
}
