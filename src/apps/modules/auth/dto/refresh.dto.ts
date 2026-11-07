export type RefreshDto = {
  refreshToken: string;
};

export function parseRefreshDto(body: unknown): RefreshDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const { refreshToken } = body as Record<string, unknown>;

  if (typeof refreshToken !== 'string' || !refreshToken.trim()) {
    throw new Error('refreshToken is required');
  }

  return { refreshToken: refreshToken.trim() };
}
