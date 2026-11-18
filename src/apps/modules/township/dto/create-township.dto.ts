export type CreateTownshipDto = {
  name: string;
  code: string;
  countryId: string;
  focalPrefix: string;
  description?: string | null;
};

const CODE_PATTERN = /^[A-Z0-9_]+$/;
const FOCAL_PREFIX_PATTERN = /^[A-Z0-9]+$/;
const FOCAL_PREFIX_MAX = 5;

export function parseCreateTownshipDto(body: unknown): CreateTownshipDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    throw new Error('name is required');
  }
  const code =
    typeof record.code === 'string' ? record.code.trim().toUpperCase() : '';
  if (!code) {
    throw new Error('code is required');
  }
  if (!CODE_PATTERN.test(code)) {
    throw new Error('code must match A-Z0-9_');
  }
  const countryId =
    typeof record.countryId === 'string' ? record.countryId.trim() : '';
  if (!countryId) {
    throw new Error('countryId is required');
  }

  const focalPrefix =
    typeof record.focalPrefix === 'string'
      ? record.focalPrefix.trim().toUpperCase()
      : '';
  if (!focalPrefix) {
    throw new Error('focalPrefix is required');
  }
  if (focalPrefix.length > FOCAL_PREFIX_MAX) {
    throw new Error(`focalPrefix must be at most ${FOCAL_PREFIX_MAX} characters`);
  }
  if (!FOCAL_PREFIX_PATTERN.test(focalPrefix)) {
    throw new Error('focalPrefix must match A-Z0-9');
  }

  let description: string | null | undefined;
  if ('description' in record) {
    if (record.description === null) {
      description = null;
    } else if (typeof record.description === 'string') {
      description = record.description.trim() || null;
    } else {
      throw new Error('description must be a string or null');
    }
  }

  return { name, code, countryId, focalPrefix, description };
}
