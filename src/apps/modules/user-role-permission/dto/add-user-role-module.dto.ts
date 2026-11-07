const MAX_BATCH = 20;

export type AddUserRoleModuleDto = {
  moduleIds: string[];
};

export function parseAddUserRoleModuleDto(
  body: unknown,
): AddUserRoleModuleDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;

  let rawIds: unknown[] = [];
  if (Array.isArray(record.moduleIds)) {
    rawIds = record.moduleIds;
  } else if (typeof record.moduleId === 'string') {
    rawIds = [record.moduleId];
  }

  const seen = new Set<string>();
  const moduleIds: string[] = [];
  for (const value of rawIds) {
    if (typeof value !== 'string') {
      continue;
    }
    const id = value.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    moduleIds.push(id);
  }

  if (moduleIds.length === 0) {
    throw new Error('moduleIds is required');
  }

  if (moduleIds.length > MAX_BATCH) {
    throw new Error(`At most ${MAX_BATCH} systems can be added at once`);
  }

  return { moduleIds };
}
