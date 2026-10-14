export interface AdminProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN';
}

export interface AdminSystemInfoDto {
  environment: string;
  serverTime: string;
  version: string;
}

export interface AdminModuleDto {
  id: string;
  name: string;
  description: string;
  status: 'AVAILABLE' | 'PLANNED';
  path?: string;
}

export interface AdminDashboardResponseData {
  admin: AdminProfileDto;
  system: AdminSystemInfoDto;
  modules: AdminModuleDto[];
}
