export type CreateImmunizationSessionDto = {
  name: string;
  projectId: string;
  townshipId: string;
  description?: string | null;
};

export function parseCreateImmunizationSessionDto(
  body: unknown,
): CreateImmunizationSessionDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    throw new Error('name is required');
  }

  const projectId =
    typeof record.projectId === 'string' ? record.projectId.trim() : '';
  if (!projectId) {
    throw new Error('projectId is required');
  }

  const townshipId =
    typeof record.townshipId === 'string' ? record.townshipId.trim() : '';
  if (!townshipId) {
    throw new Error('townshipId is required');
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

  return { name, projectId, townshipId, description };
}
