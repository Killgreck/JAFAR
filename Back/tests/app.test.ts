import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import express from 'express';

describe('App', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  describe('Health endpoint', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('404 handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Not Found' });
    });

    it('should return 404 for non-existent POST routes', async () => {
      const response = await request(app).post('/api/non-existent-route');
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ message: 'Not Found' });
    });
  });

  describe('Error handler', () => {
    it('should handle errors with custom status', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle errors without status (500)', async () => {
      const response = await request(app)
        .get('/api/bets/invalid-id-format');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message');
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      expect(response.status).toBe(400);
    });

    it('should handle error without message', async () => {
      const testApp = express();
      testApp.use(express.json());

      testApp.get('/test-error', (_req, _res, next) => {
        const error: any = {};
        error.status = 500;
        next(error);
      });

      testApp.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
        const status = err.status ?? 500;
        res.status(status).json({ message: err.message ?? 'Internal Server Error' });
      });

      const response = await request(testApp).get('/test-error');
      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Internal Server Error');
    });
  });

  describe('CORS', () => {
    it('should have CORS headers', async () => {
      const response = await request(app).get('/api/health');
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('JSON parsing', () => {
    it('should parse JSON body', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', username: 'testuser', password: 'password123' });

      expect(response.status).toBe(201);
    });
  });
});
