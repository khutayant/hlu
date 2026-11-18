import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type MeetingAttendanceActor = {
  id: string;
  name: string;
};

export type MeetingAttendanceEmployee = {
  id: string;
  employeeNo: string;
  focalNo: string;
  displayName: string;
  titleName: string | null;
};

export type MeetingAttendance = {
  id: string;
  meetingId: string;
  remark: string | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: MeetingAttendanceActor | null;
  updatedBy: MeetingAttendanceActor | null;
  employee: MeetingAttendanceEmployee | null;
};

export type MeetingAttendanceListResult = {
  items: MeetingAttendance[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type MeetingAttendanceImportResolveResult = {
  found: Array<{
    focalNo: string;
    employeeId: string;
    displayName: string;
    titleName: string | null;
    employeeNo: string;
  }>;
  missing: string[];
  alreadyAttending: string[];
};

export type MeetingAttendanceImportResult = {
  imported: number;
  failed: number;
  results: Array<{
    focalNo: string;
    ok: boolean;
    error?: string;
    item?: MeetingAttendance;
  }>;
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

export async function listMeetingAttendanceRequest(options: {
  meetingId: string;
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<MeetingAttendanceListResult> {
  const params = new URLSearchParams();
  params.set('meetingId', options.meetingId);
  if (options.q) {
    params.set('q', options.q);
  }
  if (options.page) {
    params.set('page', String(options.page));
  }
  if (options.limit) {
    params.set('limit', String(options.limit));
  }
  if (options.active !== undefined) {
    params.set('active', String(options.active));
  }
  const response = await apiFetch(
    `${API_URL}v1/meeting-attendance?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAttendanceListResult;
}

export async function createMeetingAttendanceRequest(input: {
  meetingId: string;
  focalNo: string;
  remark?: string | null;
}): Promise<MeetingAttendance> {
  const response = await apiFetch(`${API_URL}v1/meeting-attendance`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAttendance;
}

export async function importMeetingAttendanceRequest(input: {
  meetingId: string;
  rows: Array<{ focalNo: string; remark?: string | null }>;
}): Promise<MeetingAttendanceImportResult> {
  const response = await apiFetch(`${API_URL}v1/meeting-attendance/import`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAttendanceImportResult;
}

export async function resolveMeetingAttendanceImportRequest(input: {
  meetingId: string;
  focalNos: string[];
}): Promise<MeetingAttendanceImportResolveResult> {
  const response = await apiFetch(
    `${API_URL}v1/meeting-attendance/import/resolve`,
    {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAttendanceImportResolveResult;
}

export async function setMeetingAttendanceActiveRequest(
  id: string,
  active: boolean,
): Promise<MeetingAttendance> {
  const response = await apiFetch(
    `${API_URL}v1/meeting-attendance/${id}/active`,
    {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ active }),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAttendance;
}
