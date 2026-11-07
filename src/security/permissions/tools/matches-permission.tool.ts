import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data.js';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data.js';

export type PermissionRef = {
  subject: string;
  action: string;
};

/**
 * Whether a granted permission satisfies a required route permission.
 *
 * Rules:
 * - subject `all` matches any required subject
 * - action `manage` matches any required action
 * - so `all` + `manage` can do anything
 */
export function permissionSatisfies(
  granted: PermissionRef,
  required: PermissionRef,
): boolean {
  const subjectOk =
    granted.subject === PERMISSION_SUBJECT.ALL ||
    granted.subject === required.subject;

  const actionOk =
    granted.action === PERMISSION_ACTION.MANAGE ||
    granted.action === required.action;

  return subjectOk && actionOk;
}

/** True if any granted permission satisfies the required pair. */
export function anyPermissionSatisfies(
  granted: readonly PermissionRef[],
  required: PermissionRef,
): boolean {
  return granted.some((item) => permissionSatisfies(item, required));
}
