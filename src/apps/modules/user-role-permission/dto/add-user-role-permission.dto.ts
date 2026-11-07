const MAX_BATCH = 20;

export type AddUserRolePermissionDto = {
  permissionIds: string[];
};

export function parseAddUserRolePermissionDto(
  body: unknown,
): AddUserRolePermissionDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;

  let rawIds: unknown[] = [];
  if (Array.isArray(record.permissionIds)) {
    rawIds = record.permissionIds;
  } else if (typeof record.permissionId === 'string') {
    rawIds = [record.permissionId];
  }

  const seen = new Set<string>();
  const permissionIds: string[] = [];
  for (const value of rawIds) {
    if (typeof value !== 'string') {
      continue;
    }
    const id = value.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    permissionIds.push(id);
  }

  if (permissionIds.length === 0) {
    throw new Error('permissionIds is required');
  }

  if (permissionIds.length > MAX_BATCH) {
    throw new Error(`At most ${MAX_BATCH} permissions can be added at once`);
  }

  return { permissionIds };
}
