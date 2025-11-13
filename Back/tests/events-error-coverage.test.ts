import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';

const app = createApp();

describe('Events API - Error Coverage', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await UserModel.create({
      email: 'event-error@example.com',
      username: 'event-error-tester',
      passwordHash: 'hash',
    });

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    authToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/events - Missing Fields', () => {
    it('rejects request without title', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Title is required');
    });

    it('rejects request without description', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Description is required');
    });

    it('rejects request without category', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Category must be one of');
    });

    it('rejects request without betting deadline', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Betting deadline is required');
    });

    it('rejects request without expected resolution date', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Expected resolution date is required');
    });

    it('rejects request without result options', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Result options must be an array');
    });

    it('rejects result options that is not an array', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: 'Not an array',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Result options must be an array');
    });
  });

  describe('GET /api/events/:id - Invalid IDs', () => {
    it('rejects invalid event ID format', async () => {
      const response = await request(app)
        .get('/api/events/invalid-id-format')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid event ID');
    });

    it('rejects invalid creator ID in filter', async () => {
      const response = await request(app)
        .get('/api/events?creator=invalid-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid creator ID');
    });
  });

  describe('Authentication Errors', () => {
    it('rejects request without Authorization header', async () => {
      const response = await request(app)
        .get('/api/events');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Authentication required');
    });

    it('rejects request with invalid token format', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Authentication required');
    });

    it('rejects request with invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/events')
        .set('Authorization', 'Bearer invalid.jwt.token');

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('Invalid token');
    });
  });

  describe('Date Format Errors', () => {
    it('rejects invalid betting deadline date format', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: 'invalid-date-format',
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid betting deadline date format');
    });

    it('rejects invalid expected resolution date format', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: 'invalid-date-format',
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid expected resolution date format');
    });
  });
});
