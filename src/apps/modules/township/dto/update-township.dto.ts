export type UpdateTownshipDto = {
  name?: string;
  countryId?: string;
  focalPrefix?: string;
  description?: string | null;
};

const FOCAL_PREFIX_PATTERN = /^[A-Z0-9]+$/;
const FOCAL_PREFIX_MAX = 5;

export function parseUpdateTownshipDto(body: unknown): UpdateTownshipDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateTownshipDto = {};

  if ('name' in record) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new Error('name must be a non-empty string');
    }
    dto.name = record.name.trim();
  }

  if ('countryId' in record) {
    if (typeof record.countryId !== 'string' || !record.countryId.trim()) {
      throw new Error('countryId must be a non-empty string');
    }
    dto.countryId = record.countryId.trim();
  }

  if ('focalPrefix' in record) {
    if (typeof record.focalPrefix !== 'string') {
      throw new Error('focalPrefix must be a string');
    }
    const focalPrefix = record.focalPrefix.trim().toUpperCase();
    if (!focalPrefix) {
      throw new Error('focalPrefix is required');
    }
    if (focalPrefix.length > FOCAL_PREFIX_MAX) {
      throw new Error(
        `focalPrefix must be at most ${FOCAL_PREFIX_MAX} characters`,
      );
    }
    if (!FOCAL_PREFIX_PATTERN.test(focalPrefix)) {
      throw new Error('focalPrefix must match A-Z0-9');
    }
    dto.focalPrefix = focalPrefix;
  }

  if ('description' in record) {
    if (record.description === null) {
      dto.description = null;
    } else if (typeof record.description === 'string') {
      dto.description = record.description.trim() || null;
    } else {
      throw new Error('description must be a string or null');
    }
  }

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }
  return dto;
}
