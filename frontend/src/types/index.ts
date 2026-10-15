export interface ApiHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

export * from './catalog';
export * from './cart';
export * from './checkout';
export * from './auth';
export * from './address';
export * from './wishlist';
export * from './review';
export * from './admin';
export * from './coupon';
