import { apiGet, apiPost } from './api-client';
import type { UserDto, RegisterInput, LoginInput, AuthResponseData } from '@/types';

export async function registerUser(data: RegisterInput): Promise<UserDto> {
  const response = await apiPost<{ success: boolean; data: AuthResponseData }>(
    'auth/register',
    data
  );
  return response.data.user;
}

export async function loginUser(data: LoginInput): Promise<UserDto> {
  const response = await apiPost<{ success: boolean; data: AuthResponseData }>('auth/login', data);
  return response.data.user;
}

export async function logoutUser(): Promise<void> {
  await apiPost<{ success: boolean; message: string }>('auth/logout');
}

export async function fetchCurrentUser(): Promise<UserDto> {
  const response = await apiGet<{ success: boolean; data: AuthResponseData }>('auth/me');
  return response.data.user;
}
