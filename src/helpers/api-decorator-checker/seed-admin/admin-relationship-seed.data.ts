/**
 * ADMIN role relationship seed (runs after module / role / permission seeds).
 *
 * Source of truth also mirrored in
 * `res/seed/user-role-permission-data/user-role-permission-data.json`
 * (not a data-engine upsert — mapping tables have no unique `code`).
 */
export type AdminRelationshipSeedRow = {
  roleCode: string;
  moduleCodes: readonly string[];
  permissionCodes: readonly string[];
};

export const ADMIN_RELATIONSHIP_SEED_ROWS: readonly AdminRelationshipSeedRow[] =
  [
    {
      roleCode: 'ADMIN',
      moduleCodes: ['ALL_SYSTEM'],
      permissionCodes: ['PERM_ALL_MANAGE'],
    },
  ];
