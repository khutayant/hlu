import { randomUUID } from 'crypto';
import type { MigrationInterface, QueryRunner } from 'typeorm';

type CanonicalPermission = {
  code: string;
  subject: string;
  action: string;
  name: string;
  /** Legacy codes that merge into this canonical row. */
  legacyCodes: string[];
};

const CANONICAL: CanonicalPermission[] = [
  {
    code: 'PERM_ALL_MANAGE',
    subject: 'all',
    action: 'manage',
    name: 'All Manage',
    legacyCodes: ['PERM_ALL_MANAGE'],
  },
  {
    code: 'PERM_AUTH_READ',
    subject: 'auth',
    action: 'read',
    name: 'Auth Read',
    legacyCodes: ['PERM_AUTH_READ', 'PERM_AUTH_ME'],
  },
  {
    code: 'PERM_FILE_CREATE',
    subject: 'file',
    action: 'create',
    name: 'File Create',
    legacyCodes: [
      'PERM_FILE_CREATE',
      'PERM_FILE_UPLOAD',
      'PERM_FILE_UPLOAD_ZIP',
      'PERM_FILE_UPLOAD_BULK_ZIP',
    ],
  },
  {
    code: 'PERM_FILE_LIST',
    subject: 'file',
    action: 'list',
    name: 'File List',
    legacyCodes: ['PERM_FILE_LIST'],
  },
  {
    code: 'PERM_FILE_READ',
    subject: 'file',
    action: 'read',
    name: 'File Read',
    legacyCodes: [
      'PERM_FILE_READ',
      'PERM_FILE_GET',
      'PERM_FILE_CATEGORY_BY_CODE',
    ],
  },
  {
    code: 'PERM_USER_PROFILE_UPDATE',
    subject: 'user-profile',
    action: 'update',
    name: 'User-profile Update',
    legacyCodes: [
      'PERM_USER_PROFILE_UPDATE',
      'PERM_USER_PROFILE_SET_AVATAR',
      'PERM_USER_PROFILE_SET_COVER',
      'PERM_USER_PROFILE_CLEAR_AVATAR',
      'PERM_USER_PROFILE_CLEAR_COVER',
    ],
  },
  {
    code: 'PERM_USER_ROLE_LIST',
    subject: 'user-role',
    action: 'list',
    name: 'User-role List',
    legacyCodes: [
      'PERM_USER_ROLE_LIST',
      'PERM_USER_ROLE_PERMISSION_LIST',
      'PERM_USER_ROLE_PERMISSION_CANDIDATE_LIST',
      'PERM_USER_ROLE_ROLE_PERMISSION_LIST',
      'PERM_USER_ROLE_USER_CANDIDATE_LIST',
      'PERM_USER_ROLE_USER_LIST',
    ],
  },
  {
    code: 'PERM_USER_ROLE_READ',
    subject: 'user-role',
    action: 'read',
    name: 'User-role Read',
    legacyCodes: ['PERM_USER_ROLE_READ', 'PERM_USER_ROLE_GET'],
  },
  {
    code: 'PERM_USER_ROLE_CREATE',
    subject: 'user-role',
    action: 'create',
    name: 'User-role Create',
    legacyCodes: [
      'PERM_USER_ROLE_CREATE',
      'PERM_USER_ROLE_PERMISSION_ADD',
      'PERM_USER_ROLE_USER_ADD',
    ],
  },
  {
    code: 'PERM_USER_ROLE_UPDATE',
    subject: 'user-role',
    action: 'update',
    name: 'User-role Update',
    legacyCodes: [
      'PERM_USER_ROLE_UPDATE',
      'PERM_USER_ROLE_SET_PERMISSIONS',
    ],
  },
  {
    code: 'PERM_USER_ROLE_DELETE',
    subject: 'user-role',
    action: 'delete',
    name: 'User-role Delete',
    legacyCodes: [
      'PERM_USER_ROLE_DELETE',
      'PERM_USER_ROLE_PERMISSION_REMOVE',
      'PERM_USER_ROLE_USER_REMOVE',
    ],
  },
];

export class ManualGenerated1794064449863 implements MigrationInterface {
  name = 'ManualGenerated1794064449863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const keepCodes = new Set(CANONICAL.map((row) => row.code));

    for (const target of CANONICAL) {
      const existing = (await queryRunner.query(
        `
          SELECT "id", "code"
          FROM "permission_master"
          WHERE "code" = ANY($1)
          ORDER BY CASE WHEN "code" = $2 THEN 0 ELSE 1 END, "createdDate" ASC
        `,
        [target.legacyCodes, target.code],
      )) as Array<{ id: string; code: string }>;

      let canonicalId = existing.find((row) => row.code === target.code)?.id;

      if (!canonicalId && existing.length > 0) {
        canonicalId = existing[0].id;
        await queryRunner.query(
          `
            UPDATE "permission_master"
            SET
              "code" = $1,
              "subject" = $2,
              "action" = $3,
              "name" = $4,
              "active" = true
            WHERE "id" = $5
          `,
          [
            target.code,
            target.subject,
            target.action,
            target.name,
            canonicalId,
          ],
        );
      } else if (!canonicalId) {
        canonicalId = randomUUID();
        await queryRunner.query(
          `
            INSERT INTO "permission_master"
              ("id", "code", "name", "subject", "action", "description", "active", "createdDate", "updatedDate")
            VALUES
              ($1, $2, $3, $4, $5, NULL, true, now(), now())
          `,
          [
            canonicalId,
            target.code,
            target.name,
            target.subject,
            target.action,
          ],
        );
      } else {
        await queryRunner.query(
          `
            UPDATE "permission_master"
            SET
              "subject" = $1,
              "action" = $2,
              "name" = $3,
              "active" = true
            WHERE "id" = $4
          `,
          [target.subject, target.action, target.name, canonicalId],
        );
      }

      const legacyIds = existing
        .map((row) => row.id)
        .filter((id) => id !== canonicalId);

      if (legacyIds.length > 0) {
        await queryRunner.query(
          `
            UPDATE "user_role_permission_mapping" AS mapping
            SET "permissionId" = $1
            WHERE "permissionId" = ANY($2)
              AND NOT EXISTS (
                SELECT 1
                FROM "user_role_permission_mapping" AS other
                WHERE other."userRoleId" = mapping."userRoleId"
                  AND other."permissionId" = $1
              )
          `,
          [canonicalId, legacyIds],
        );

        await queryRunner.query(
          `
            DELETE FROM "user_role_permission_mapping"
            WHERE "permissionId" = ANY($1)
          `,
          [legacyIds],
        );

        await queryRunner.query(
          `
            DELETE FROM "permission_master"
            WHERE "id" = ANY($1)
          `,
          [legacyIds],
        );
      }
    }

    const leftovers = (await queryRunner.query(
      `
        SELECT "id", "code"
        FROM "permission_master"
        WHERE "code" <> ALL($1)
      `,
      [[...keepCodes]],
    )) as Array<{ id: string; code: string }>;

    if (leftovers.length > 0) {
      const leftoverIds = leftovers.map((row) => row.id);
      await queryRunner.query(
        `
          DELETE FROM "user_role_permission_mapping"
          WHERE "permissionId" = ANY($1)
        `,
        [leftoverIds],
      );
      await queryRunner.query(
        `
          DELETE FROM "permission_master"
          WHERE "id" = ANY($1)
        `,
        [leftoverIds],
      );
    }
  }

  public async down(): Promise<void> {
    // Irreversible code consolidation.
  }
}
