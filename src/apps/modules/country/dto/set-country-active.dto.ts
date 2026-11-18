export type SetCountryActiveDto = {
  active: boolean;
};

export function parseSetCountryActiveDto(body: unknown): SetCountryActiveDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  if (typeof record.active !== 'boolean') {
    throw new Error('active must be a boolean');
  }
  return { active: record.active };
}
