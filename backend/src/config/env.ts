import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local backend folder if present
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5432/mandala_store?schema=public';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  corsOrigin: string;
  isProduction: boolean;
  databaseUrl?: string;
  razorpayKeyId: string;
  razorpayKeySecret?: string;
  razorpayWebhookSecret?: string;
  jwtSecret: string;
  jwtExpiresIn: string;
}

const isProd = (process.env.NODE_ENV || 'development') === 'production';
const rawJwtSecret =
  process.env.JWT_SECRET || 'development_placeholder_jwt_secret_min_32_characters';

if (
  isProd &&
  (!process.env.JWT_SECRET ||
    process.env.JWT_SECRET === 'development_placeholder_jwt_secret_min_32_characters' ||
    process.env.JWT_SECRET.length < 32)
) {
  throw new Error(
    'FATAL: JWT_SECRET must be securely configured in production environment with at least 32 characters.'
  );
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: isProd,
  databaseUrl: process.env.DATABASE_URL,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || 'test_secret_placeholder',
  razorpayWebhookSecret:
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    process.env.RAZORPAY_KEY_SECRET ||
    'test_secret_placeholder',
  jwtSecret: rawJwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
