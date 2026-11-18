export type CreateTitleDto = {
  name: string;
  code: string;
  description?: string | null;
};

const CODE_PATTERN = /^[A-Z0-9_]+$/;

export function parseCreateTitleDto(body: unknown): CreateTitleDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }
  const record = body as Record<string, unknown>;
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  if (!name) {
    throw new Error('name is required');
  }

  const code =
    typeof record.code === 'string' ? record.code.trim().toUpperCase() : '';
  if (!code) {
    throw new Error('code is required');
  }
  if (!CODE_PATTERN.test(code)) {
    throw new Error('code must match A-Z0-9_');
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

  return { name, code, description };
}
