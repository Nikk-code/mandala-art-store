import type { Request, Response } from 'express';
import { config } from '../config/env';
import type { HealthResponse } from '../types';

export function getHealth(_req: Request, res: Response<HealthResponse>): void {
  const healthData: HealthResponse = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: config.nodeEnv,
  };

  res.status(200).json(healthData);
}
