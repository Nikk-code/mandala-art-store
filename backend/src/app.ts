import express, { type Application } from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRouter from './routes';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';

export function createApp(): Application {
  const app: Application = express();

  // Middleware
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(
    express.json({
      verify: (req, _res, buf) => {
        (req as unknown as { rawBody?: Buffer }).rawBody = buf;
      },
    })
  );
  app.use(express.urlencoded({ extended: true }));

  // API Routes
  app.use('/api', apiRouter);

  // 404 Fallback
  app.use(notFoundHandler);

  // Centralized Error Handling
  app.use(errorHandler);

  return app;
}

export const app = createApp();
