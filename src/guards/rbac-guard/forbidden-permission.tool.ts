import { ForbiddenException } from '@nestjs/common';
import { formatPermissionRef } from '../../helpers/api-decorator-checker/tools/format-permission.tool.js';
import type { PermissionActionCode } from '../../resources/data/permissions/actions/permission-action.data.js';

/** Client-facing body for RBAC denials (tenant + main). */
export type ForbiddenPermissionResponse = {
  statusCode: 403;
  error: 'Forbidden';
  message: string;
  subject: string;
  action: PermissionActionCode | string;
};

/**
 * Build a ForbiddenException whose JSON body includes the required catalog
 * subject and action (no permission-master description / APIs list).
 */
export function forbiddenPermissionException(
  reqId: string | undefined,
  subject: string,
  action: PermissionActionCode | string,
): ForbiddenException {
  const ref = formatPermissionRef(subject, String(action));

  const body: ForbiddenPermissionResponse = {
    statusCode: 403,
    error: 'Forbidden',
    message: `Forbidden. Required permission ${ref}. [ReqID: ${reqId ?? 'unknown'}]`,
    subject,
    action,
  };

  return new ForbiddenException(body);
}
