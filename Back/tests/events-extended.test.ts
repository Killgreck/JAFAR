import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';

const app = createApp();

describe('Events API - Extended Coverage', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const user = await UserModel.create({
      email: 'event-extended@example.com',
      username: 'event-extended-tester',
      passwordHash: 'hash',
    });
    userId = user._id.toString();

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    authToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  describe('POST /api/events - Validation', () => {
    it('validates title minimum length (10 characters)', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Short',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('10 characters');
    });

    it('validates title maximum length (200 characters)', async () => {
      const now = new Date();
      const longTitle = 'A'.repeat(201);

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: longTitle,
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('200 characters');
    });

    it('validates description minimum length (20 characters)', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'Too short',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('20 characters');
    });

    it('validates description maximum length (1000 characters)', async () => {
      const now = new Date();
      const longDescription = 'A'.repeat(1001);

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: longDescription,
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('1000 characters');
    });

    it('validates category is one of valid options', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'InvalidCategory',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Category must be one of');
    });

    it('validates betting deadline is at least 1 hour from now', async () => {
      const now = new Date();
      const tooSoon = new Date(now.getTime() + 30 * 60 * 1000); // Only 30 minutes

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: tooSoon,
          expectedResolutionDate: new Date(tooSoon.getTime() + 24 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 1 hour');
    });

    it('validates expected resolution is after betting deadline', async () => {
      const now = new Date();
      const bettingDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
      const invalidResolution = new Date(bettingDeadline.getTime() - 60 * 1000); // Before deadline

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: bettingDeadline,
          expectedResolutionDate: invalidResolution,
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('after betting deadline');
    });

    it('validates result options minimum (2 options)', async () => {
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
          resultOptions: ['Only One'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('between 2 and 10');
    });

    it('validates result options maximum (10 options)', async () => {
      const now = new Date();
      const tooManyOptions = Array.from({ length: 11 }, (_, i) => `Option ${i + 1}`);

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: tooManyOptions,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('between 2 and 10');
    });

    it('rejects events with past betting deadlines', async () => {
      const now = new Date();
      const pastDate = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago

      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Valid Event Title',
          description: 'This is a valid description with more than 20 characters.',
          category: 'Deportes',
          bettingDeadline: pastDate,
          expectedResolutionDate: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          resultOptions: ['A', 'B'],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 1 hour');
    });

    it('saves event with creatorId from authenticated user', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Event with Creator ID Test',
          description: 'This event should have the creator ID from the authenticated user.',
          category: 'Economía',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['Success', 'Failure'],
        });

      expect(response.status).toBe(201);
      expect(response.body.creator).toBe(userId);
    });

    it('initializes event with status "open"', async () => {
      const now = new Date();
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Event Status Test',
          description: 'This event should be created with status open by default.',
          category: 'Entretenimiento',
          bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000),
          expectedResolutionDate: new Date(now.getTime() + 26 * 60 * 60 * 1000),
          resultOptions: ['Yes', 'No'],
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('open');
    });
  });

  describe('GET /api/events - Filtering', () => {
    it('filters events by status', async () => {
      const response = await request(app)
        .get('/api/events?status=open')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((event: any) => {
        expect(event.status).toBe('open');
      });
    });

    it('filters events by creator', async () => {
      const response = await request(app)
        .get(`/api/events?creator=${userId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((event: any) => {
        expect(event.creator).toBe(userId);
      });
    });

    it('rejects invalid category filter', async () => {
      const response = await request(app)
        .get('/api/events?category=InvalidCategory')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid category');
    });
  });
});
