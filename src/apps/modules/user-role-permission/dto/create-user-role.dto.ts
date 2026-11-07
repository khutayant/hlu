export type CreateUserRoleDto = {
  name: string;
  code: string;
  description?: string | null;
};

export function parseCreateUserRoleDto(body: unknown): CreateUserRoleDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const code = typeof record.code === 'string' ? record.code.trim() : '';

  if (!name) {
    throw new Error('name is required');
  }
  if (!code) {
    throw new Error('code is required');
  }

  const description =
    typeof record.description === 'string'
      ? record.description.trim() || null
      : record.description === null
        ? null
        : undefined;

  return { name, code, description };
}
