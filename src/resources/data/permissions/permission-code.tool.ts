import type { PermissionActionCode } from './actions/permission-action.data.js';
import type { PermissionSubjectCode } from './subjects/permission-subject.data.js';

/**
 * Canonical maintenance code: `PERM_{SUBJECT}_{ACTION}`
 * (hyphens → underscores, uppercased).
 *
 * Example: `user-role` + `list` → `PERM_USER_ROLE_LIST`
 */
export function formatPermissionCode(
  subject: PermissionSubjectCode | string,
  action: PermissionActionCode | string,
): string {
  return `PERM_${subject}_${action}`.replaceAll('-', '_').toUpperCase();
}

/** Build `@Api*` `permission` meta from subject + action. */
export function buildRoutePermission(options: {
  subject: PermissionSubjectCode;
  action: PermissionActionCode;
  description?: string | null;
}) {
  return {
    code: formatPermissionCode(options.subject, options.action),
    subject: options.subject,
    action: options.action,
    description: options.description ?? null,
  };
}
