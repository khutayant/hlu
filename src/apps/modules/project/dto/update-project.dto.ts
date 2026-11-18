export type UpdateProjectDto = {
  name?: string;
  description?: string | null;
};

export function parseUpdateProjectDto(body: unknown): UpdateProjectDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateProjectDto = {};

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

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }
  return dto;
}
