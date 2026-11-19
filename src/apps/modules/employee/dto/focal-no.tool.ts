/**
 * Focal number rules:
 * - Uppercase A–Z then digits 0–9 only (`^[A-Z]+[0-9]+$`)
 * - Both letter and digit parts required (e.g. `A91`, `M003`)
 * - No interleaved mixture (e.g. `A9Z1` rejected)
 * - Max length 9
 * - Head office (no township): letter prefix must be `HO`
 * - With township: letter prefix must match that township's `focalPrefix`
 */
export const FOCAL_NO_PATTERN = /^[A-Z]+[0-9]+$/;
export const FOCAL_NO_MAX_LENGTH = 9;
/** Letter prefix for employees with no township (head office). */
export const HEAD_OFFICE_FOCAL_PREFIX = 'HO';

/** Trim, strip all whitespace, uppercase (e.g. ` ho 001 ` → `HO001`). */
export function normalizeFocalNo(value: string): string {
  return value.replace(/\s+/g, '').toUpperCase();
}

/** Leading A–Z letters of a normalized focal no (e.g. `HO` from `HO003`). */
export function focalNoLetterPrefix(focalNo: string): string {
  const match = normalizeFocalNo(focalNo).match(/^([A-Z]+)/);
  return match?.[1] ?? '';
}

export function parseFocalNo(value: unknown, options?: { required?: boolean }) {
  const required = options?.required !== false;

  if (value === undefined || value === null) {
    if (required) {
      throw new Error('focalNo is required');
    }
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error('focalNo must be a string');
  }

  const focalNo = normalizeFocalNo(value);
  if (!focalNo) {
    if (required) {
      throw new Error('focalNo is required');
    }
    return null;
  }

  if (focalNo.length > FOCAL_NO_MAX_LENGTH) {
    throw new Error(`focalNo must be at most ${FOCAL_NO_MAX_LENGTH} characters`);
  }

  if (!FOCAL_NO_PATTERN.test(focalNo)) {
    throw new Error(
      'focalNo must be letters A–Z followed by digits 0–9 only (e.g. A91, M003)',
    );
  }

  return focalNo;
}
