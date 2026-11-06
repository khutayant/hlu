export type CallbackDto = {
  code: string;
  state: string;
};

export function parseCallbackDto(body: unknown): CallbackDto {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body is required');
  }

  const { code, state } = body as Record<string, unknown>;

  if (typeof code !== 'string' || !code.trim()) {
    throw new Error('code is required');
  }

  if (typeof state !== 'string' || !state.trim()) {
    throw new Error('state is required');
  }

  return {
    code: code.trim(),
    state: state.trim(),
  };
}
