/** Permission / endpoint maintenance codes: `A-Z0-9_`. */
export const AZ09_CODE_PATTERN_REGEX = '^[A-Z0-9_]+$';

const PERMISSION_CODE_PATTERN = new RegExp(AZ09_CODE_PATTERN_REGEX);

/** Same `code` cannot mean two subject/action pairs, and one pair cannot have two codes. */
export class PermissionCatalogConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PermissionCatalogConflictError';
  }
}

export type PermissionCatalogConflictReport = {
  /** One subject + action claimed by more than one code. */
  subjectAction?: Array<{
    subject: string;
    action: string;
    codes: string[];
  }>;
  /** One code claimed by more than one subject + action. */
  code?: Array<{
    code: string;
    subjectActions: Array<{ subject: string; action: string }>;
  }>;
};

/** Throw every catalog conflict in one pretty-printed JSON error. */
export function throwIfPermissionCatalogConflicts(
  report: PermissionCatalogConflictReport,
): void {
  const subjectAction = report.subjectAction ?? [];
  const code = report.code ?? [];
  if (subjectAction.length === 0 && code.length === 0) {
    return;
  }
  const total = subjectAction.length + code.length;
  const body: PermissionCatalogConflictReport & {
    total: number;
    totalEnd?: number;
  } = { total };
  if (subjectAction.length > 0) {
    body.subjectAction = subjectAction;
  }
  if (code.length > 0) {
    body.code = code;
  }
  body.totalEnd = total;
  throw new PermissionCatalogConflictError(JSON.stringify(body, null, 2));
}

/** `A-Z0-9_` permission maintenance code. */
export function assertPermissionCode(code: string): string {
  const trimmed = code.trim();
  if (!PERMISSION_CODE_PATTERN.test(trimmed)) {
    throw new PermissionCatalogConflictError(
      `Permission code "${trimmed}" must match A-Z0-9_`,
    );
  }
  return trimmed;
}

/** Route permission maintenance code (required on `@Api*` `permission`). */
export function resolveRoutePermissionCode(permissionCode: string): string {
  if (!permissionCode?.trim()) {
    throw new PermissionCatalogConflictError(
      'Permission code is required on @Api* permission',
    );
  }
  return assertPermissionCode(permissionCode);
}

/**
 * Maintenance code for a seed-only permission (no route owns the pair).
 * Hyphens in train-case subjects become underscores.
 */
export function formatSeedPermissionCode(
  subject: string,
  action: string,
): string {
  return assertPermissionCode(
    `PERM_${subject}_${action}`.replaceAll('-', '_').toUpperCase(),
  );
}
