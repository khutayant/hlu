import type { MigrationInterface, QueryRunner } from 'typeorm';

/** Canonical permission codes → subject/action (`a-z0-9-`). */
const PERMISSION_BACKFILL: Array<{
  code: string;
  subject: string;
  action: string;
}> = [
  { code: 'PERM_ALL_MANAGE', subject: 'all', action: 'manage' },
  { code: 'PERM_AUTH_READ', subject: 'auth', action: 'read' },
  { code: 'PERM_AUTH_ME', subject: 'auth', action: 'read' },
  { code: 'PERM_FILE_CREATE', subject: 'file', action: 'create' },
  { code: 'PERM_FILE_UPLOAD', subject: 'file', action: 'create' },
  { code: 'PERM_FILE_UPLOAD_ZIP', subject: 'file', action: 'create' },
  { code: 'PERM_FILE_UPLOAD_BULK_ZIP', subject: 'file', action: 'create' },
  { code: 'PERM_FILE_LIST', subject: 'file', action: 'list' },
  { code: 'PERM_FILE_READ', subject: 'file', action: 'read' },
  { code: 'PERM_FILE_GET', subject: 'file', action: 'read' },
  { code: 'PERM_FILE_CATEGORY_BY_CODE', subject: 'file', action: 'read' },
  { code: 'PERM_USER_PROFILE_UPDATE', subject: 'user-profile', action: 'update' },
  { code: 'PERM_USER_PROFILE_SET_AVATAR', subject: 'user-profile', action: 'update' },
  { code: 'PERM_USER_PROFILE_SET_COVER', subject: 'user-profile', action: 'update' },
  { code: 'PERM_USER_PROFILE_CLEAR_AVATAR', subject: 'user-profile', action: 'update' },
  { code: 'PERM_USER_PROFILE_CLEAR_COVER', subject: 'user-profile', action: 'update' },
  { code: 'PERM_USER_ROLE_LIST', subject: 'user-role', action: 'list' },
  { code: 'PERM_USER_ROLE_PERMISSION_LIST', subject: 'user-role', action: 'list' },
  {
    code: 'PERM_USER_ROLE_PERMISSION_CANDIDATE_LIST',
    subject: 'user-role',
    action: 'list',
  },
  {
    code: 'PERM_USER_ROLE_ROLE_PERMISSION_LIST',
    subject: 'user-role',
    action: 'list',
  },
  { code: 'PERM_USER_ROLE_USER_CANDIDATE_LIST', subject: 'user-role', action: 'list' },
  { code: 'PERM_USER_ROLE_USER_LIST', subject: 'user-role', action: 'list' },
  { code: 'PERM_USER_ROLE_READ', subject: 'user-role', action: 'read' },
  { code: 'PERM_USER_ROLE_GET', subject: 'user-role', action: 'read' },
  { code: 'PERM_USER_ROLE_CREATE', subject: 'user-role', action: 'create' },
  { code: 'PERM_USER_ROLE_PERMISSION_ADD', subject: 'user-role', action: 'create' },
  { code: 'PERM_USER_ROLE_USER_ADD', subject: 'user-role', action: 'create' },
  { code: 'PERM_USER_ROLE_UPDATE', subject: 'user-role', action: 'update' },
  { code: 'PERM_USER_ROLE_SET_PERMISSIONS', subject: 'user-role', action: 'update' },
  { code: 'PERM_USER_ROLE_DELETE', subject: 'user-role', action: 'delete' },
  { code: 'PERM_USER_ROLE_PERMISSION_REMOVE', subject: 'user-role', action: 'delete' },
  { code: 'PERM_USER_ROLE_USER_REMOVE', subject: 'user-role', action: 'delete' },
];

export class ManualGenerated1794063917791 implements MigrationInterface {
  name = 'ManualGenerated1794063917791';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ADD "subject" character varying(64) NOT NULL DEFAULT 'pending'
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ADD "action" character varying(64) NOT NULL DEFAULT 'pending'
    `);

    for (const row of PERMISSION_BACKFILL) {
      await queryRunner.query(
        `
          UPDATE "permission_master"
          SET "subject" = $1, "action" = $2
          WHERE "code" = $3
        `,
        [row.subject, row.action, row.code],
      );
    }

    await queryRunner.query(`
      DELETE FROM "user_role_permission_mapping"
      WHERE "permissionId" IN (
        SELECT "id" FROM "permission_master"
        WHERE "code" IN (
          'PERM_USER_PROFILE_UPLOAD_AVATAR',
          'PERM_USER_PROFILE_UPLOAD_COVER'
        )
      )
    `);
    await queryRunner.query(`
      DELETE FROM "permission_master"
      WHERE "code" IN (
        'PERM_USER_PROFILE_UPLOAD_AVATAR',
        'PERM_USER_PROFILE_UPLOAD_COVER'
      )
    `);

    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ADD CONSTRAINT "UQ_permission_master_code" UNIQUE ("code")
    `);

    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ADD CONSTRAINT "CHK_permission_master_subject"
      CHECK ("subject" ~ '^[a-z0-9-]{1,64}$')
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ADD CONSTRAINT "CHK_permission_master_action"
      CHECK ("action" ~ '^[a-z0-9-]{1,64}$')
    `);

    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ALTER COLUMN "subject" DROP DEFAULT
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      ALTER COLUMN "action" DROP DEFAULT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      DROP CONSTRAINT "CHK_permission_master_action"
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      DROP CONSTRAINT "CHK_permission_master_subject"
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master"
      DROP CONSTRAINT "UQ_permission_master_code"
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master" DROP COLUMN "action"
    `);
    await queryRunner.query(`
      ALTER TABLE "permission_master" DROP COLUMN "subject"
    `);
  }
}
