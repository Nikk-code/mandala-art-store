import type { Request, Response, NextFunction } from 'express';
import { orderService, paymentService } from '../services';
import type { ApiSuccessResponse, OrderResponseDto, PaymentInitializationDto } from '../types';

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

export async function initializePayment(
  req: Request,
  res: Response<ApiSuccessResponse<PaymentInitializationDto>>,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;
    const paymentInfo = await paymentService.initializePayment(orderId);

    res.status(200).json({
      success: true,
      data: paymentInfo,
    });
  } catch (error) {
    next(error);
  }
}
