export type UserRoleType = 'CUSTOMER' | 'ADMIN';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRoleType;
  createdAt: Date | string;
}

export interface RegisterRequest {
  name?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponseDto {
  user: UserDto;
}

export interface JwtUserPayload {
  id: string;
  email: string;
  role: UserRoleType;
}
