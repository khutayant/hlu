export type UpdateCategoryDto = {
  name?: string;
  code?: string;
  description?: string | null;
  parentCategoryId?: string | null;
  isPosting?: boolean;
};

const CODE_PATTERN = /^[A-Z0-9_]+$/;

export function parseUpdateCategoryDto(body: unknown): UpdateCategoryDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateCategoryDto = {};

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

  if ('parentCategoryId' in record) {
    if (record.parentCategoryId === null || record.parentCategoryId === '') {
      dto.parentCategoryId = null;
    } else if (typeof record.parentCategoryId === 'string') {
      const parentCategoryId = record.parentCategoryId.trim();
      dto.parentCategoryId = parentCategoryId || null;
    } else {
      throw new Error('parentCategoryId must be a string or null');
    }
  }

  if ('isPosting' in record) {
    if (typeof record.isPosting !== 'boolean') {
      throw new Error('isPosting must be a boolean');
    }
    dto.isPosting = record.isPosting;
  }

  if (Object.keys(dto).length === 0) {
    throw new Error('At least one field is required');
  }
  return dto;
}
