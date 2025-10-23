import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/model';
import { BetModel } from '../src/modules/bets/model';

describe('Bets API - Extended Coverage', () => {
  const app = createApp();
  let testUserId: string;
  let testUserId2: string;

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await BetModel.deleteMany({});
    await UserModel.deleteMany({});

    const user1 = await UserModel.create({
      email: 'creator@test.com',
      username: 'creator',
      passwordHash: 'hashedpassword',
    });
    testUserId = user1._id.toString();

    const user2 = await UserModel.create({
      email: 'opponent@test.com',
      username: 'opponent',
      passwordHash: 'hashedpassword',
    });
    testUserId2 = user2._id.toString();
  });

  describe('POST /api/bets - Error handling', () => {
    it('should handle service errors gracefully', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: 'invalid-object-id-format',
          description: 'Test bet',
          amount: 100,
        });

      expect(response.status).toBe(400);
    });

    it('should reject bet with missing description', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          amount: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('description');
    });

    it('should reject bet with missing amount', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          description: 'Test bet',
        });

      expect(response.status).toBe(400);
    });

    it('should reject bet with negative amount', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          description: 'Test bet',
          amount: -50,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('non-negative');
    });

    it('should reject bet with invalid opponent id', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          opponent: 'invalid-id',
          description: 'Test bet',
          amount: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('opponent');
    });

    it('should accept bet with null opponent', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          opponent: null,
          description: 'Test bet',
          amount: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.opponent).toBeUndefined();
    });

    it('should accept bet with undefined opponent', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          description: 'Test bet',
          amount: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.opponent).toBeUndefined();
    });

    it('should accept bet with valid opponent', async () => {
      const response = await request(app)
        .post('/api/bets')
        .send({
          creator: testUserId,
          opponent: testUserId2,
          description: 'Test bet',
          amount: 100,
        });

      expect(response.status).toBe(201);
      expect(response.body.opponent).toBe(testUserId2);
    });
  });

  describe('GET /api/bets - Error handling', () => {
    it('should handle database errors in list', async () => {
      await BetModel.create({
        creator: testUserId,
        description: 'Test bet',
        amount: 100,
      });

      const response = await request(app).get('/api/bets');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/bets/:id - Error handling', () => {
    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app).get('/api/bets/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('valid identifier');
    });

    it('should return 404 for non-existent bet', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/bets/${nonExistentId}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bet not found');
    });

    it('should return bet with opponent', async () => {
      const bet = await BetModel.create({
        creator: testUserId,
        opponent: testUserId2,
        description: 'Test bet with opponent',
        amount: 100,
      });

      const response = await request(app).get(`/api/bets/${bet._id}`);
      expect(response.status).toBe(200);
      expect(response.body.opponent).toBe(testUserId2);
    });

    it('should return bet without opponent', async () => {
      const bet = await BetModel.create({
        creator: testUserId,
        description: 'Test bet without opponent',
        amount: 100,
      });

      const response = await request(app).get(`/api/bets/${bet._id}`);
      expect(response.status).toBe(200);
      expect(response.body.opponent).toBeUndefined();
    });
  });
});
