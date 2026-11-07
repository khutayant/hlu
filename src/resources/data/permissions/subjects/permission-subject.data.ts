/**
 * Allowed RBAC subject codes (`a-z0-9-`, max 64).
 * Use these values in `@Api*` `permission.subject` and `PermissionMaster.subject`.
 *
 * Bypass:
 * - {@link PERMISSION_SUBJECT.ALL} matches **any** required subject.
 * - Pair with {@link PERMISSION_ACTION.MANAGE} (`all` + `manage`) to allow everything.
 */
export const PERMISSION_SUBJECT = {
  /** Wildcard subject — grants the action on every subject. */
  ALL: 'all',

  AUTH: 'auth',
  FILE: 'file',
  USER_PROFILE: 'user-profile',
  USER_ROLE: 'user-role',
} as const;

export type PermissionSubjectCode =
  (typeof PERMISSION_SUBJECT)[keyof typeof PERMISSION_SUBJECT];

export const PERMISSION_SUBJECT_CODES = Object.values(
  PERMISSION_SUBJECT,
) as PermissionSubjectCode[];
