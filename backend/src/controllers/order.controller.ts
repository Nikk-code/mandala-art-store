import type { Request, Response, NextFunction } from 'express';
import { orderService } from '../services';
import type { ApiSuccessResponse, OrderDetailsDto, OrderHistoryResponseDto } from '../types';

export async function getOrderById(
  req: Request,
  res: Response<ApiSuccessResponse<OrderDetailsDto>>,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const order = await orderService.getOrderById(orderId, userId);

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

export async function getOrderHistory(
  req: Request,
  res: Response<ApiSuccessResponse<OrderHistoryResponseDto>>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const pageSize = parseInt(req.query.pageSize as string, 10) || 10;

    const result = await orderService.getOrderHistory(userId, page, pageSize);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
