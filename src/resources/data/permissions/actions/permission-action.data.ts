/**
 * Allowed RBAC action codes (`a-z0-9-`, max 64).
 * Use these values in `@Api*` `permission.action` and `PermissionMaster.action`.
 *
 * Bypass:
 * - {@link PERMISSION_ACTION.MANAGE} satisfies **any** required action
 *   on a matching subject (including {@link PERMISSION_SUBJECT.ALL}).
 */
export const PERMISSION_ACTION = {
  /** Wildcard action — grants every action on the matched subject. */
  MANAGE: 'manage',

  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  EXECUTE: 'execute',
} as const;

export type PermissionActionCode =
  (typeof PERMISSION_ACTION)[keyof typeof PERMISSION_ACTION];

export const PERMISSION_ACTION_CODES = Object.values(
  PERMISSION_ACTION,
) as PermissionActionCode[];
