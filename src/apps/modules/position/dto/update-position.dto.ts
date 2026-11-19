export type UpdatePositionDto = {
  name?: string;
  code?: string;
  description?: string | null;
  categoryId?: string | null;
};

const CODE_PATTERN = /^[A-Z0-9_]+$/;

export function parseUpdatePositionDto(body: unknown): UpdatePositionDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdatePositionDto = {};

  if ('name' in record) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new Error('name must be a non-empty string');
    }
    dto.name = record.name.trim();
  }

  if ('code' in record) {
    if (typeof record.code !== 'string' || !record.code.trim()) {
      throw new Error('code must be a non-empty string');
    }
    const code = record.code.trim().toUpperCase();
    if (!CODE_PATTERN.test(code)) {
      throw new Error('code must match A-Z0-9_');
    }
    dto.code = code;
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

  if ('categoryId' in record) {
    if (record.categoryId === null || record.categoryId === '') {
      dto.categoryId = null;
    } else if (typeof record.categoryId === 'string') {
      dto.categoryId = record.categoryId.trim() || null;
    } else {
      throw new Error('categoryId must be a string or null');
    }
  }

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }
  return dto;
}
