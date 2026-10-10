import { createContext, useContext } from 'react';
import type { UserDto, RegisterInput, LoginInput } from '@/types';

export interface AuthContextValue {
  user: UserDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginInput) => Promise<UserDto>;
  register: (data: RegisterInput) => Promise<UserDto>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<UserDto | null>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const defaultAuthContextValue: AuthContextValue = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => {
    throw new Error('useAuth must be used within an AuthProvider to perform login');
  },
  register: async () => {
    throw new Error('useAuth must be used within an AuthProvider to perform register');
  },
  logout: async () => {},
  refreshUser: async () => null,
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  return context || defaultAuthContextValue;
}
