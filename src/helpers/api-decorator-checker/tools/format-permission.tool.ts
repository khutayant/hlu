/**
 * Canonical permission reference: `[subject].[action]` (lowercase train-case codes).
 * Always use this when concatenating subject + action for logs, Forbidden bodies, or UI.
 */
export function formatPermissionRef(subject: string, action: string): string {
  return `${subject}.${action}`;
}

function capitalizeFirst(value: string): string {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/**
 * Human-readable permission catalog name: `[Subject] [Action]`.
 * Only the first character of each word is capitalized.
 * Example: action `delete`, subject `all` → `All Delete`.
 */
export function formatPermissionName(action: string, subject: string): string {
  return `${capitalizeFirst(subject)} ${capitalizeFirst(action)}`;
}

/** Strip a trailing/embedded legacy `APIs: …` section from description text. */
export function stripPermissionApisSection(
  description: string | null | undefined,
): string {
  if (!description?.trim()) {
    return '';
  }
  return (
    description
      // Legacy bracketed: `APIs: [CODE], [CODE2]`
      .replace(/\s*APIs:\s*(?:\[[^\]]*\]\s*,\s*)*\[[^\]]*\]\s*\.?$/i, '')
      // Any trailing APIs section
      .replace(/\s*APIs:\s*.+$/i, '')
      .trim()
  );
}

/**
 * Human description only (no attached API codes).
 */
export function buildPermissionDescription(options: {
  base?: string | null;
}): string {
  return stripPermissionApisSection(options.base);
}
