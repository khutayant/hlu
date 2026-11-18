export type SetTownshipActiveDto = {
  active: boolean;
};

export function parseSetTownshipActiveDto(body: unknown): SetTownshipActiveDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  if (typeof record.active !== 'boolean') {
    throw new Error('active must be a boolean');
  }
  return { active: record.active };
}
