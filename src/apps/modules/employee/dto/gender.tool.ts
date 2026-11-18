import { GenderEnum } from '@app/entity/enums/gender.enum';

const GENDER_VALUES = new Set<string>(Object.values(GenderEnum));

/**
 * Parse gender from API / CSV input.
 * Accepts enum values (`MALE` / `FEMALE` / `OTHER`) case-insensitively,
 * plus common aliases (`M`, `F`, `male`, `female`, …).
 */
export function parseGender(
  value: unknown,
  options?: { required?: boolean },
): GenderEnum | undefined {
  const required = options?.required ?? true;

  if (value === undefined || value === null) {
    if (required) {
      throw new Error('gender is required');
    }
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error('gender must be a string');
  }

  const raw = value.trim();
  if (!raw) {
    if (required) {
      throw new Error('gender is required');
    }
    return undefined;
  }

  const normalized = raw.toUpperCase().replace(/[\s-]+/g, '_');
  const aliases: Record<string, GenderEnum> = {
    MALE: GenderEnum.MALE,
    M: GenderEnum.MALE,
    MAN: GenderEnum.MALE,
    FEMALE: GenderEnum.FEMALE,
    F: GenderEnum.FEMALE,
    WOMAN: GenderEnum.FEMALE,
    OTHER: GenderEnum.OTHER,
    O: GenderEnum.OTHER,
    UNKNOWN: GenderEnum.OTHER,
  };

  const gender = aliases[normalized];
  if (!gender || !GENDER_VALUES.has(gender)) {
    throw new Error('gender must be MALE, FEMALE, or OTHER');
  }

  return gender;
}
