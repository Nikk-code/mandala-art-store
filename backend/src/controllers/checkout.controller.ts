import type { Request, Response, NextFunction } from 'express';
import { orderService } from '../services';
import type { ApiSuccessResponse, OrderResponseDto } from '../types';

export async function createOrder(
  req: Request,
  res: Response<ApiSuccessResponse<{ order: OrderResponseDto }>>,
  next: NextFunction
): Promise<void> {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

    const order = await orderService.createOrder(req.body, idempotencyKey);

    res.status(201).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
}
