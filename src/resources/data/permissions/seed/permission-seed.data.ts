import { PERMISSION_ACTION } from '../actions/permission-action.data';
import { formatPermissionCode } from '../permission-code.tool';
import {
  PERMISSION_SUBJECT,
  PERMISSION_SUBJECT_CODES,
  type PermissionSubjectCode,
} from '../subjects/permission-subject.data';

function titleCaseSubject(subject: string): string {
  return subject
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function manageSeedDescription(subject: PermissionSubjectCode): string {
  if (subject === PERMISSION_SUBJECT.ALL) {
    return 'Bypass all subjects and actions (full access). subject=all, action=manage.';
  }
  return `Allow every action on subject=${subject} (action=manage).`;
}

/**
 * Seed-only permissions (not bound to a single `@Api*` route).
 * Upserted by {@link PermissionSeedService} alongside discovered route permissions.
 *
 * Always includes `{subject}:manage` for every {@link PERMISSION_SUBJECT}
 * so roles can grant full control of a subject without listing each action.
 */
export const PERMISSION_SEED_ROWS = PERMISSION_SUBJECT_CODES.map((subject) => ({
  code: formatPermissionCode(subject, PERMISSION_ACTION.MANAGE),
  subject,
  action: PERMISSION_ACTION.MANAGE,
  name: `${titleCaseSubject(subject)} Manage`,
  description: manageSeedDescription(subject),
}));
