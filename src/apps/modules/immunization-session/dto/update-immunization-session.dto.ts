export type UpdateImmunizationSessionDto = {
  name?: string;
  projectId?: string;
  townshipId?: string;
  description?: string | null;
};

export function parseUpdateImmunizationSessionDto(
  body: unknown,
): UpdateImmunizationSessionDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const dto: UpdateImmunizationSessionDto = {};

  if ('name' in record) {
    if (typeof record.name !== 'string' || !record.name.trim()) {
      throw new Error('name must be a non-empty string');
    }
    dto.name = record.name.trim();
  }

  if ('projectId' in record) {
    if (typeof record.projectId !== 'string' || !record.projectId.trim()) {
      throw new Error('projectId must be a non-empty string');
    }
    dto.projectId = record.projectId.trim();
  }

  if ('townshipId' in record) {
    if (typeof record.townshipId !== 'string' || !record.townshipId.trim()) {
      throw new Error('townshipId must be a non-empty string');
    }
    dto.townshipId = record.townshipId.trim();
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
