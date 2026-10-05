import type { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services';

export async function handleRazorpayWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    const rawBody =
      (req as unknown as { rawBody?: Buffer }).rawBody ??
      (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

    const result = await paymentService.processWebhook(rawBody, signature, req.body);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
