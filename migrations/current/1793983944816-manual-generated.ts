import type { MigrationInterface, QueryRunner } from 'typeorm';

export class ManualGenerated1793983944816 implements MigrationInterface {
  name = 'ManualGenerated1793983944816';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_master" (
        "id" uuid NOT NULL,
        "createdDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "createdBy" uuid,
        "updatedDate" TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updatedBy" uuid,
        "active" boolean NOT NULL DEFAULT true,
        "keycloakId" character varying(64) NOT NULL,
        "username" character varying(100) NOT NULL,
        "email" character varying(255),
        "emailVerified" boolean NOT NULL DEFAULT false,
        "firstName" character varying(100),
        "lastName" character varying(100),
        "role" character varying(32) NOT NULL DEFAULT 'STAFF',
        "lastLoginAt" TIMESTAMPTZ,
        CONSTRAINT "PK_user_master_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_master_keycloakId" UNIQUE ("keycloakId"),
        CONSTRAINT "UQ_user_master_username" UNIQUE ("username")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_user_master_email" ON "user_master" ("email")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_user_master_email"`);
    await queryRunner.query(`DROP TABLE "user_master"`);
  }
}
