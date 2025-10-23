import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/model';
import { WalletModel } from '../src/modules/wallet/model';

describe('Wallet API - Extended Coverage', () => {
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
    await WalletModel.deleteMany({});
    await UserModel.deleteMany({});

    const user1 = await UserModel.create({
      email: 'user1@test.com',
      username: 'user1',
      passwordHash: 'password123',
    });
    testUserId = user1._id.toString();

    const user2 = await UserModel.create({
      email: 'user2@test.com',
      username: 'user2',
      passwordHash: 'password123',
    });
    testUserId2 = user2._id.toString();
  });

  describe('POST /api/wallet - Error handling', () => {
    it('should reject wallet without user', async () => {
      const response = await request(app)
        .post('/api/wallet')
        .send({
          balance: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('user');
    });

    it('should reject wallet with invalid user id', async () => {
      const response = await request(app)
        .post('/api/wallet')
        .send({
          user: 'invalid-id',
          balance: 100,
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('valid identifier');
    });

    it('should reject wallet with non-number balance', async () => {
      const response = await request(app)
        .post('/api/wallet')
        .send({
          user: testUserId,
          balance: 'not-a-number',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('balance must be a number');
    });

    it('should accept wallet without balance (default to 0)', async () => {
      const response = await request(app)
        .post('/api/wallet')
        .send({
          user: testUserId,
        });

      expect(response.status).toBe(201);
      expect(response.body.balance).toBe(0);
    });

    it('should accept wallet with balance 0', async () => {
      const response = await request(app)
        .post('/api/wallet')
        .send({
          user: testUserId,
          balance: 0,
        });

      expect(response.status).toBe(201);
      expect(response.body.balance).toBe(0);
    });

    it('should accept wallet with positive balance', async () => {
      const response = await request(app)
        .post('/api/wallet')
        .send({
          user: testUserId,
          balance: 500,
        });

      expect(response.status).toBe(201);
      expect(response.body.balance).toBe(500);
    });

    it('should return 409 for duplicate wallet', async () => {
      await WalletModel.create({
        user: testUserId,
        balance: 100,
      });

      const response = await request(app)
        .post('/api/wallet')
        .send({
          user: testUserId,
          balance: 200,
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /api/wallet/:userId - Error handling', () => {
    it('should return 400 for invalid userId format', async () => {
      const response = await request(app).get('/api/wallet/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('valid identifier');
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await request(app).get(`/api/wallet/${testUserId}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Wallet not found');
    });

    it('should return wallet with timestamps', async () => {
      await WalletModel.create({
        user: testUserId,
        balance: 100,
      });

      const response = await request(app).get(`/api/wallet/${testUserId}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });

  describe('PUT /api/wallet/:userId/balance - Error handling', () => {
    beforeEach(async () => {
      await WalletModel.create({
        user: testUserId,
        balance: 100,
      });
    });

    it('should return 400 for invalid userId format', async () => {
      const response = await request(app)
        .put('/api/wallet/invalid-id/balance')
        .send({ balance: 200 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('valid identifier');
    });

    it('should return 400 for missing balance', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId}/balance`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('balance must be a number');
    });

    it('should return 400 for non-number balance', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId}/balance`)
        .send({ balance: 'not-a-number' });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('balance must be a number');
    });

    it('should return 400 for negative balance', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId}/balance`)
        .send({ balance: -50 });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot be negative');
    });

    it('should return 404 for non-existent wallet', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId2}/balance`)
        .send({ balance: 200 });

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Wallet not found');
    });

    it('should accept balance 0', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId}/balance`)
        .send({ balance: 0 });

      expect(response.status).toBe(200);
      expect(response.body.balance).toBe(0);
    });

    it('should update balance successfully', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId}/balance`)
        .send({ balance: 500 });

      expect(response.status).toBe(200);
      expect(response.body.balance).toBe(500);
    });

    it('should return updated wallet with timestamps', async () => {
      const response = await request(app)
        .put(`/api/wallet/${testUserId}/balance`)
        .send({ balance: 300 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });
});
