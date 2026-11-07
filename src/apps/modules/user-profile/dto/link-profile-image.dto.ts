export type LinkProfileImageDto = {
  fileId: string;
};

export function parseLinkProfileImageDto(body: unknown): LinkProfileImageDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const record = body as Record<string, unknown>;
  const fileId =
    typeof record.fileId === 'string' ? record.fileId.trim() : '';

  if (!fileId) {
    throw new Error('fileId is required');
  }

  return { fileId };
}
