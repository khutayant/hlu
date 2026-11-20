import { API_URL } from '../config';
import { apiFetch } from './api.handler';
import {
  getFileCategoryByCodeRequest,
  uploadFileRequest,
} from './file.handler';

export type EmployeeSignatureImage = {
  id: string;
  uuidName: string;
  mimeType: string;
};

export type EmployeeSignatureActor = {
  id: string;
  name: string;
};

export type EmployeeSignatureStyles = {
  nameFontSize: number;
  positionFontSize: number;
  imageScale: number;
  textAndImageGap: number;
};

export type EmployeeSignature = {
  id: string;
  employeeId: string;
  name: string;
  primary: boolean;
  signatureName: string;
  signaturePosition: string;
  description: string | null;
  signatureStyles: EmployeeSignatureStyles | null;
  signatureImage: EmployeeSignatureImage | null;
  active: boolean;
  createdDate: string;
  updatedDate: string;
  createdBy: EmployeeSignatureActor | null;
  updatedBy: EmployeeSignatureActor | null;
};

export type EmployeeSignatureListResult = {
  items: EmployeeSignature[];
  total: number;
  page: number;
  limit: number;
  active: boolean;
};

export type CreateEmployeeSignatureInput = {
  employeeId: string;
  name: string;
  signatureImageId: string;
  signatureName: string;
  signaturePosition: string;
  primary?: boolean;
  description?: string | null;
  signatureStyles?: EmployeeSignatureStyles | null;
};

export type UpdateEmployeeSignatureInput = {
  name?: string;
  signatureImageId?: string;
  signatureName?: string;
  signaturePosition?: string;
  primary?: boolean;
  description?: string | null;
  signatureStyles?: EmployeeSignatureStyles | null;
};

function jsonHeaders(): HeadersInit {
  return { 'Content-Type': 'application/json' };
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) {
      return body.message.join(', ');
    }
    if (typeof body.message === 'string' && body.message.trim()) {
      return body.message;
    }
  } catch {
    // ignore
  }
  return `Request failed (${response.status})`;
}

export async function listEmployeeSignaturesRequest(options: {
  employeeId: string;
  q?: string;
  page?: number;
  limit?: number;
  active?: boolean;
}): Promise<EmployeeSignatureListResult> {
  const params = new URLSearchParams();
  params.set('employeeId', options.employeeId);
  if (options.q) params.set('q', options.q);
  if (options.page) params.set('page', String(options.page));
  if (options.limit) params.set('limit', String(options.limit));
  if (options.active !== undefined) {
    params.set('active', String(options.active));
  }
  const response = await apiFetch(
    `${API_URL}v1/employee-signature?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as EmployeeSignatureListResult;
}

/** One signature per employee for reports: primary if set, else latest. */
export async function listPrimarySignaturesByEmployeeIdsRequest(
  employeeIds: string[],
): Promise<EmployeeSignature[]> {
  const unique = [...new Set(employeeIds.map((id) => id.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return [];
  }
  const params = new URLSearchParams();
  params.set('employeeIds', unique.join(','));
  const response = await apiFetch(
    `${API_URL}v1/employee-signature/primary-by-employees?${params.toString()}`,
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  const body = (await response.json()) as { items: EmployeeSignature[] };
  return body.items;
}

export async function createEmployeeSignatureRequest(
  input: CreateEmployeeSignatureInput,
): Promise<EmployeeSignature> {
  const response = await apiFetch(`${API_URL}v1/employee-signature`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as EmployeeSignature;
}

export async function updateEmployeeSignatureRequest(
  id: string,
  input: UpdateEmployeeSignatureInput,
): Promise<EmployeeSignature> {
  const response = await apiFetch(`${API_URL}v1/employee-signature/${id}`, {
    method: 'PATCH',
    headers: jsonHeaders(),
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as EmployeeSignature;
}

export async function setEmployeeSignatureActiveRequest(
  id: string,
  active: boolean,
): Promise<EmployeeSignature> {
  const response = await apiFetch(
    `${API_URL}v1/employee-signature/${id}/active`,
    {
      method: 'PATCH',
      headers: jsonHeaders(),
      body: JSON.stringify({ active }),
    },
  );
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }
  return (await response.json()) as EmployeeSignature;
}

/** Upload image as `SIGNATURE_IMAGE`; caller links via create/update `signatureImageId`. */
export async function uploadEmployeeSignatureImageRequest(
  file: File,
): Promise<EmployeeSignatureImage> {
  const category = await getFileCategoryByCodeRequest('SIGNATURE_IMAGE');
  const uploaded = await uploadFileRequest(file, {
    categoryId: category.id,
    name: file.name || 'employee-signature.png',
    description: 'Employee signature image',
  });
  return {
    id: uploaded.id,
    uuidName: uploaded.uuidName,
    mimeType: uploaded.mimeType,
  };
}
