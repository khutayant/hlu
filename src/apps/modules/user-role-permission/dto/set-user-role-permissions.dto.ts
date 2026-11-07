export type SetUserRolePermissionsDto = {
  permissionIds: string[];
};

export function parseSetUserRolePermissionsDto(
  body: unknown,
): SetUserRolePermissionsDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  if (!Array.isArray(record.permissionIds)) {
    throw new Error('permissionIds must be an array');
  }

  const permissionIds = [
    ...new Set(
      record.permissionIds.map((id) => {
        if (typeof id !== 'string' || !id.trim()) {
          throw new Error('permissionIds must contain non-empty strings');
        }
        return id.trim();
      }),
    ),
  ];

  return { permissionIds };
}
