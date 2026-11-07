import { PERMISSION_ACTION } from '../actions/permission-action.data.js';
import { formatPermissionCode } from '../permission-code.tool.js';
import { PERMISSION_SUBJECT } from '../subjects/permission-subject.data.js';

/**
 * Seed-only permissions (not bound to a single `@Api*` route).
 * Upserted by {@link PermissionSeedService} alongside discovered route permissions.
 */
export const PERMISSION_SEED_ROWS = [
  {
    code: formatPermissionCode(
      PERMISSION_SUBJECT.ALL,
      PERMISSION_ACTION.MANAGE,
    ),
    subject: PERMISSION_SUBJECT.ALL,
    action: PERMISSION_ACTION.MANAGE,
    name: 'All Manage',
    description:
      'Bypass all subjects and actions (full access). subject=all, action=manage.',
  },
] as const;
