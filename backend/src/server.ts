import { app } from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => {
  console.info(`[Server] Mandala Art Store API running on http://localhost:${config.port}`);
  console.info(`[Server] Health check available at http://localhost:${config.port}/api/health`);
  console.info(`[Server] Environment: ${config.nodeEnv}`);
});

process.on('SIGTERM', () => {
  console.info('[Server] SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.info('[Server] Process terminated.');
  });
});
