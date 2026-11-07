export type UpdateUserRoleDto = {
  name?: string;
  description?: string | null;
};

export function parseUpdateUserRoleDto(body: unknown): UpdateUserRoleDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  const dto: UpdateUserRoleDto = {};

  if ('name' in record) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new Error('name must be a non-empty string');
    }
    dto.name = record.name.trim();
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

  if (dto.name === undefined && dto.description === undefined) {
    throw new Error('At least one of name, description is required');
  }

  return dto;
}
