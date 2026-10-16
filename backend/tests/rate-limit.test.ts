import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Application } from 'express';
import { createAuthRateLimiter, AUTH_RATE_LIMIT_ERROR_MESSAGE } from '../src/middleware/rate-limit';
import { app } from '../src/app';

describe('Authentication Rate Limiting Foundation', () => {
  let testApp: Application;

  beforeEach(() => {
    testApp = express();
    testApp.use(express.json());
  });

  it('allows requests within the configured threshold and sets RateLimit headers', async () => {
    const limiter = createAuthRateLimiter({
      windowMs: 60 * 1000,
      max: 3,
    });

    testApp.post('/test-rate-limit', limiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    // Request 1
    const res1 = await request(testApp).post('/test-rate-limit');
    expect(res1.status).toBe(200);
    expect(res1.headers['ratelimit-limit']).toBe('3');
    expect(res1.headers['ratelimit-remaining']).toBe('2');

    // Request 2
    const res2 = await request(testApp).post('/test-rate-limit');
    expect(res2.status).toBe(200);
    expect(res2.headers['ratelimit-remaining']).toBe('1');
  });

  it('blocks requests exceeding the threshold with 429 and standardized error response', async () => {
    const limiter = createAuthRateLimiter({
      windowMs: 60 * 1000,
      max: 2,
    });

    testApp.post('/test-rate-limit', limiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    // 1st request - allowed
    const res1 = await request(testApp).post('/test-rate-limit');
    expect(res1.status).toBe(200);

    // 2nd request - allowed
    const res2 = await request(testApp).post('/test-rate-limit');
    expect(res2.status).toBe(200);

    // 3rd request - blocked by rate limit
    const res3 = await request(testApp).post('/test-rate-limit');
    expect(res3.status).toBe(429);
    expect(res3.body.success).toBe(false);
    expect(res3.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(res3.body.error.message).toBe(AUTH_RATE_LIMIT_ERROR_MESSAGE);
    expect(res3.headers['ratelimit-remaining']).toBe('0');
  });

  it('tracks request limits per individual client IP address', async () => {
    const limiter = createAuthRateLimiter({
      windowMs: 60 * 1000,
      max: 1,
    });

    testApp.set('trust proxy', true);
    testApp.post('/test-rate-limit', limiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    // IP 1 first request -> allowed
    const res1 = await request(testApp)
      .post('/test-rate-limit')
      .set('X-Forwarded-For', '203.0.113.195');
    expect(res1.status).toBe(200);

    // IP 1 second request -> 429
    const res2 = await request(testApp)
      .post('/test-rate-limit')
      .set('X-Forwarded-For', '203.0.113.195');
    expect(res2.status).toBe(429);

    // IP 2 first request -> allowed (independent quota)
    const res3 = await request(testApp)
      .post('/test-rate-limit')
      .set('X-Forwarded-For', '198.51.100.42');
    expect(res3.status).toBe(200);
  });

  it('attaches RateLimit headers to live POST /api/auth/login route', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ratelimit-check@example.com',
      password: 'Password123',
    });

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  it('attaches RateLimit headers to live POST /api/auth/register route', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'invalid-email',
      password: 'short',
    });

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  it('attaches RateLimit headers to live POST /api/auth/change-password route', async () => {
    const res = await request(app).post('/api/auth/change-password').send({
      currentPassword: 'OldPassword123',
      newPassword: 'NewPassword123',
    });

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });
});
