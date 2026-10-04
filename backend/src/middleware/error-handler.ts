import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import type { ApiErrorResponse } from '../types';

export function errorHandler(
  err: Error & { statusCode?: number; code?: string },
  _req: Request,
  res: Response<ApiErrorResponse>,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const errorCode = err.code || (statusCode >= 500 ? 'INTERNAL_SERVER_ERROR' : 'BAD_REQUEST');
  const message =
    config.isProduction && statusCode >= 500
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal server error';

  if (!config.isProduction) {
    // Development logging for tracing
    console.error(`[Error] ${errorCode}: ${err.message}`, err.stack);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message,
    },
  });
}
