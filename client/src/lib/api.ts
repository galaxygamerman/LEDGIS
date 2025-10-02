import { storage } from './storage';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

function resolveErrorMessage(payload: unknown, status: number): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'message' in payload &&
    typeof (payload as Record<string, unknown>).message === 'string'
  ) {
    return (payload as Record<string, unknown>).message as string;
  }

  if (typeof payload === 'string' && payload.trim().length > 0) {
    return payload;
  }

  return `Request failed with status ${status}`;
}

function buildHeaders(options: RequestInit): Headers {
  const headers = new Headers(options.headers ?? {});
  const isFormData = options.body instanceof FormData;

  if (!isFormData && options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  const token = storage.getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return headers;
}

async function safeParseJson(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function safeReadText(response: Response): Promise<string | null> {
  try {
    const text = await response.text();
    return text.length > 0 ? text : null;
  } catch {
    return null;
  }
}

function parseFileNameFromDisposition(disposition: string | null): string | undefined {
  if (!disposition) return undefined;

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8Match && utf8Match[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const quotedMatch = /filename="?([^";]+)"?/i.exec(disposition);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1];
  }

  return undefined;
}

export interface DownloadResponse {
  blob: Blob;
  fileName?: string;
  contentType?: string | null;
}

export async function apiDownload(path: string, options: RequestInit = {}): Promise<DownloadResponse> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = buildHeaders(options);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    const payload = contentType?.includes('application/json') ? await safeParseJson(response) : await safeReadText(response);
    throw new ApiError(resolveErrorMessage(payload, response.status), response.status, payload);
  }

  const blob = await response.blob();
  return {
    blob,
    fileName: parseFileNameFromDisposition(response.headers.get('content-disposition')),
    contentType: response.headers.get('content-type'),
  };
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = buildHeaders(options);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let payload: unknown = null;

  if (response.status !== 204) {
    if (contentType?.includes('application/json')) {
      payload = await safeParseJson(response);
    } else {
      payload = await safeReadText(response);
    }
  }

  if (!response.ok) {
    throw new ApiError(resolveErrorMessage(payload, response.status), response.status, payload);
  }

  return payload as T;
}

export async function apiRequestBlob(path: string, options: RequestInit = {}): Promise<Blob> {
  const { blob } = await apiDownload(path, options);
  return blob;
}
