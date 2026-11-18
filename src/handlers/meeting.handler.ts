import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type MeetingActor = {
  id: string;
  name: string;
};

export type Meeting = {
  id: string;
  name: string;
  meetingNo: string;
  fromDate: string;
  toDate: string;
  description: string | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: MeetingActor | null;
  updatedBy: MeetingActor | null;
};

export type MeetingListResult = {
  items: Meeting[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateMeetingInput = {
  name: string;
  fromDate: string;
  toDate: string;
  description?: string | null;
};

export type UpdateMeetingInput = {
  name?: string;
  fromDate?: string;
  toDate?: string;
  description?: string | null;
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(data.message)) {
      return data.message.join(', ');
    }
    if (typeof data.message === 'string' && data.message) {
      return data.message;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

export async function listMeetingsRequest(options?: {
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<MeetingListResult> {
  const params = new URLSearchParams();
  if (options?.q) {
    params.set('q', options.q);
  }
  if (options?.page) {
    params.set('page', String(options.page));
  }
  if (options?.limit) {
    params.set('limit', String(options.limit));
  }
  if (options?.active !== undefined) {
    params.set('active', String(options.active));
  }
  const query = params.toString();
  const response = await apiFetch(
    `${API_URL}v1/meeting${query ? `?${query}` : ''}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingListResult;
}

export async function getMeetingByIdRequest(id: string): Promise<Meeting> {
  const response = await apiFetch(`${API_URL}v1/meeting/${id}`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Meeting;
}

export async function createMeetingRequest(
  input: CreateMeetingInput,
): Promise<Meeting> {
  const response = await apiFetch(`${API_URL}v1/meeting`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Meeting;
}

export async function updateMeetingRequest(
  id: string,
  input: UpdateMeetingInput,
): Promise<Meeting> {
  const response = await apiFetch(`${API_URL}v1/meeting/${id}`, {
    method: 'PUT',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Meeting;
}

export async function setMeetingActiveRequest(
  id: string,
  active: boolean,
): Promise<Meeting> {
  const response = await apiFetch(`${API_URL}v1/meeting/${id}/active`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify({ active }),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as Meeting;
}
