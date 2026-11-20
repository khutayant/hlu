export type SetEmployeeSignatureActiveDto = {
  active: boolean;
};

export function parseSetEmployeeSignatureActiveDto(
  body: unknown,
): SetEmployeeSignatureActiveDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  if (typeof record.active !== 'boolean') {
    throw new Error('active must be a boolean');
  }
  return { active: record.active };
}
