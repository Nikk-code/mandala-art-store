import { Router } from 'express';
import { handleRazorpayWebhook } from '../controllers/webhook.controller';

const webhookRouter = Router();

// POST /api/webhooks/razorpay
webhookRouter.post('/razorpay', handleRazorpayWebhook);

export default webhookRouter;
