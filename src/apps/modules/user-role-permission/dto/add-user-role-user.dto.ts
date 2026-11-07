const MAX_BATCH = 20;

export type AddUserRoleUserDto = {
  userIds: string[];
};

export function parseAddUserRoleUserDto(body: unknown): AddUserRoleUserDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;

  let rawIds: unknown[] = [];
  if (Array.isArray(record.userIds)) {
    rawIds = record.userIds;
  } else if (typeof record.userId === 'string') {
    rawIds = [record.userId];
  }

  const seen = new Set<string>();
  const userIds: string[] = [];
  for (const value of rawIds) {
    if (typeof value !== 'string') {
      continue;
    }
    const id = value.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    userIds.push(id);
  }

  if (userIds.length === 0) {
    throw new Error('userIds is required');
  }

  if (userIds.length > MAX_BATCH) {
    throw new Error(`At most ${MAX_BATCH} users can be added at once`);
  }

  return { userIds };
}
