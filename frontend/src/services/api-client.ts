import { DEFAULT_API_BASE_URL, AUTH_STORAGE_KEY, DEFAULT_CUSTOMER_ID } from '@/constants';
import type { ApiHealthResponse, ApiErrorResponse } from '@/types';

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_BASE_URL;

let currentAuthToken: string | null = null;

export function setAuthToken(token: string | null): void {
  currentAuthToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(AUTH_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
}

export function getAuthToken(): string {
  if (currentAuthToken) return currentAuthToken;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) return saved;
  }
  return DEFAULT_CUSTOMER_ID;
}

function normalizeUrl(path: string): string {
  const base = API_BASE_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

export async function apiGet<T>(path: string, options?: RequestInit): Promise<T> {
  const url = normalizeUrl(path);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    method: 'GET',
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;
    let errorDetails: unknown;

    try {
      const errorJson = (await response.json()) as ApiErrorResponse;
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error.message || errorMessage;
        errorCode = errorJson.error.code;
        errorDetails = errorJson.error.details;
      }
    } catch {
      // Non-JSON error body fallback
    }

    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown, options?: RequestInit): Promise<T> {
  const url = normalizeUrl(path);
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options?.headers as Record<string, string>),
  };

  const response = await fetch(url, {
    ...options,
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;
    let errorDetails: unknown;

    try {
      const errorJson = (await response.json()) as ApiErrorResponse;
      if (errorJson && errorJson.error) {
        errorMessage = errorJson.error.message || errorMessage;
        errorCode = errorJson.error.code;
        errorDetails = errorJson.error.details;
      }
    } catch {
      // Non-JSON error body fallback
    }

    throw new ApiError(errorMessage, response.status, errorCode, errorDetails);
  }

  return response.json() as Promise<T>;
}

export async function fetchHealth(): Promise<ApiHealthResponse> {
  return apiGet<ApiHealthResponse>('health');
}
