import { apiGet, apiPost, apiPatch } from './api-client';
import type {
  UserDto,
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  AuthResponseData,
  ChangePasswordInput,
  ChangePasswordResponse,
} from '@/types';

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

export async function updateUserProfile(data: UpdateProfileInput): Promise<UserDto> {
  const response = await apiPatch<{ success: boolean; data: AuthResponseData }>('auth/me', data);
  return response.data.user;
}

export async function changeUserPassword(
  data: ChangePasswordInput
): Promise<ChangePasswordResponse> {
  return apiPost<ChangePasswordResponse>('auth/change-password', data);
}
