import { API_URL } from '../config';
import { apiFetch } from './api.handler';

export type MeetingAllowanceActor = {
  id: string;
  name: string;
};

export type MeetingAllowance = {
  id: string;
  meetingId: string;
  name: string;
  sequenceNo: number;
  unitPriceLabel: string | null;
  unitPrice: string;
  quantityLabel: string | null;
  quantity: string;
  totalAmountLabel: string | null;
  totalAmount: string;
  showTotalOnly: boolean;
  excludeHeadOffice: boolean;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: MeetingAllowanceActor | null;
  updatedBy: MeetingAllowanceActor | null;
};

export type MeetingAllowanceListResult = {
  items: MeetingAllowance[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateMeetingAllowanceInput = {
  meetingId: string;
  name: string;
  sequenceNo?: number;
  unitPriceLabel?: string | null;
  unitPrice?: string;
  quantityLabel?: string | null;
  quantity?: string;
  totalAmountLabel?: string | null;
  totalAmount?: string;
  showTotalOnly?: boolean;
  excludeHeadOffice?: boolean;
};

export type UpdateMeetingAllowanceInput = {
  name?: string;
  sequenceNo?: number;
  unitPriceLabel?: string | null;
  unitPrice?: string;
  quantityLabel?: string | null;
  quantity?: string;
  totalAmountLabel?: string | null;
  totalAmount?: string;
  showTotalOnly?: boolean;
  excludeHeadOffice?: boolean;
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

export async function listMeetingAllowancesRequest(options: {
  meetingId: string;
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<MeetingAllowanceListResult> {
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
    `${API_URL}v1/meeting-allowance?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAllowanceListResult;
}

export async function createMeetingAllowanceRequest(
  input: CreateMeetingAllowanceInput,
): Promise<MeetingAllowance> {
  const response = await apiFetch(`${API_URL}v1/meeting-allowance`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAllowance;
}

export async function updateMeetingAllowanceRequest(
  id: string,
  input: UpdateMeetingAllowanceInput,
): Promise<MeetingAllowance> {
  const response = await apiFetch(`${API_URL}v1/meeting-allowance/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAllowance;
}

export async function setMeetingAllowanceActiveRequest(
  id: string,
  active: boolean,
): Promise<MeetingAllowance> {
  const response = await apiFetch(
    `${API_URL}v1/meeting-allowance/${id}/active`,
    {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ active }),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as MeetingAllowance;
}
