import { DEFAULT_API_BASE_URL } from '@/constants';
import type { ApiHealthResponse } from '@/types';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || DEFAULT_API_BASE_URL;

export async function fetchHealth(): Promise<ApiHealthResponse> {
  const endpoint = `${API_BASE_URL.replace(/\/$/, '')}/health`;
  const response = await fetch(endpoint, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Health check failed with status: ${response.status}`);
  }

  return response.json() as Promise<ApiHealthResponse>;
}
