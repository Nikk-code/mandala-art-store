import type { Request, Response, NextFunction } from 'express';
import { orderService, paymentService } from '../services';
import type {
  ApiSuccessResponse,
  OrderResponseDto,
  PaymentInitializationDto,
  PaymentVerificationResultDto,
} from '../types';

export async function createOrder(
  req: Request,
  res: Response<ApiSuccessResponse<{ order: OrderResponseDto }>>,
  next: NextFunction
): Promise<void> {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
    const userId = req.user?.id ?? null;

    const order = await orderService.createOrder(req.body, idempotencyKey, userId);

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

export async function verifyPayment(
  req: Request,
  res: Response<ApiSuccessResponse<PaymentVerificationResultDto>>,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;
    const verificationResult = await paymentService.verifyPayment(orderId, req.body);

    res.status(200).json({
      success: true,
      data: verificationResult,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateOrder(
  req: Request,
  res: Response<ApiSuccessResponse<{ order: OrderResponseDto }>>,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;
    const guestAccessToken = req.headers['x-guest-access-token'] as string | undefined;

    const order = await orderService.updatePendingOrder(
      orderId,
      req.body,
      req.user ?? null,
      guestAccessToken
    );

    res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function cancelOrder(
  req: Request,
  res: Response<ApiSuccessResponse<{ message: string }>>,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;
    const guestAccessToken = req.headers['x-guest-access-token'] as string | undefined;

    const result = await orderService.cancelPendingOrder(
      orderId,
      req.user ?? null,
      guestAccessToken,
      req.body?.reason
    );

    res.status(200).json({
      success: true,
      data: {
        message: result.message,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getCheckoutOrder(
  req: Request,
  res: Response<ApiSuccessResponse<{ order: OrderResponseDto }>>,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;
    const guestAccessToken = req.headers['x-guest-access-token'] as string | undefined;

    const order = await orderService.getPendingOrderForCheckout(
      orderId,
      req.user ?? null,
      guestAccessToken
    );

    res.status(200).json({
      success: true,
      data: {
        order,
      },
    });
  } catch (error) {
    next(error);
  }
}
