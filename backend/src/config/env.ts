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
}

export const config: AppConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  isProduction: (process.env.NODE_ENV || 'development') === 'production',
  databaseUrl: process.env.DATABASE_URL,
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_placeholder_key_id',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
};
