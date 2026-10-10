export type UserRoleType = 'CUSTOMER' | 'ADMIN';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRoleType;
  createdAt: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponseData {
  user: UserDto;
}
