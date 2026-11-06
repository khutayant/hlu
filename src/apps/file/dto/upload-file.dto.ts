export type UploadFileDto = {
  categoryId: string;
  name?: string;
  description?: string | null;
};

export function parseUploadFileDto(body: unknown): UploadFileDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  const categoryId =
    typeof record.categoryId === 'string' ? record.categoryId.trim() : '';

  if (!categoryId) {
    throw new Error('categoryId is required');
  }

  const name =
    typeof record.name === 'string' && record.name.trim()
      ? record.name.trim()
      : undefined;

  const description =
    typeof record.description === 'string'
      ? record.description.trim() || null
      : record.description === null
        ? null
        : undefined;

  return { categoryId, name, description };
}
