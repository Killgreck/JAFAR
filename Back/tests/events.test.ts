import request from 'supertest';
import { describe, it, expect, beforeAll } from 'vitest';
import mongoose from 'mongoose';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';

const app = createApp();

describe('Events API', () => {
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    // Create a test user and get auth token
    const user = await UserModel.create({
      email: 'event-test@example.com',
      username: 'event-tester',
      passwordHash: 'hash',
    });
    userId = user._id.toString();

    // Generate token manually for testing
    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    authToken = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  });

  it('creates an event with valid data', async () => {
    const now = new Date();
    const bettingDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const expectedResolution = new Date(bettingDeadline.getTime() + 24 * 60 * 60 * 1000); // 1 day after deadline

    const response = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: '¿Quién ganará la Copa del Mundo 2026?',
        description: 'Predicción sobre el ganador de la Copa Mundial de Fútbol que se celebrará en 2026.',
        category: 'Deportes',
        bettingDeadline: bettingDeadline.toISOString(),
        expectedResolutionDate: expectedResolution.toISOString(),
        resultOptions: ['Brasil', 'Argentina', 'Francia', 'Alemania'],
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      title: '¿Quién ganará la Copa del Mundo 2026?',
      category: 'Deportes',
      status: 'open',
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body.resultOptions).toEqual(['Brasil', 'Argentina', 'Francia', 'Alemania']);
  });

  it('retrieves an event by id', async () => {
    const now = new Date();
    const bettingDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const expectedResolution = new Date(bettingDeadline.getTime() + 24 * 60 * 60 * 1000);

    // Create event via API to ensure proper initialization
    const createResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Event for Retrieval',
        description: 'This is a test event for retrieval testing purposes.',
        category: 'Política',
        bettingDeadline: bettingDeadline.toISOString(),
        expectedResolutionDate: expectedResolution.toISOString(),
        resultOptions: ['Opción A', 'Opción B'],
      });

    const eventId = createResponse.body.id;

    const response = await request(app)
      .get(`/api/events/${eventId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: eventId,
      title: 'Test Event for Retrieval',
      category: 'Política',
    });
  });

  it('lists events', async () => {
    // Create an event first
    const now = new Date();
    const bettingDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const expectedResolution = new Date(bettingDeadline.getTime() + 24 * 60 * 60 * 1000);

    await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Event for Listing',
        description: 'This is a test event that should appear in the list.',
        category: 'Economía',
        bettingDeadline: bettingDeadline.toISOString(),
        expectedResolutionDate: expectedResolution.toISOString(),
        resultOptions: ['Option 1', 'Option 2'],
      });

    const response = await request(app)
      .get('/api/events')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it('rejects unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/events')
      .send({
        title: 'This should fail',
        description: 'This event should not be created without auth',
        category: 'Deportes',
        bettingDeadline: new Date(),
        expectedResolutionDate: new Date(),
        resultOptions: ['A', 'B'],
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  });

  it('returns 404 for non-existent event', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .get(`/api/events/${fakeId}`)
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ message: 'Event not found' });
  });

  it('filters events by category', async () => {
    const response = await request(app)
      .get('/api/events?category=Deportes')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    response.body.forEach((event: any) => {
      expect(event.category).toBe('Deportes');
    });
  });
});
