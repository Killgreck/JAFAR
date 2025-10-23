import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/model';
import { BetModel } from '../src/modules/bets/model';
import * as betService from '../src/modules/bets/service';

describe('Bets Controller - Error Coverage', () => {
  const app = createApp();
  let testUserId: string;

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await BetModel.deleteMany({});
    await UserModel.deleteMany({});

    const user = await UserModel.create({
      email: 'test@test.com',
      username: 'testuser',
      passwordHash: 'password',
    });
    testUserId = user._id.toString();
    
    vi.restoreAllMocks();
  });

  it('should handle unexpected errors in list endpoint', async () => {
    vi.spyOn(betService, 'listBets').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/api/bets');
    
    expect(response.status).toBe(500);
  });

  it('should handle unexpected errors in getById endpoint', async () => {
    const bet = await BetModel.create({
      creator: testUserId,
      description: 'Test',
      amount: 100,
    });

    vi.spyOn(betService, 'getBetById').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get(`/api/bets/${bet._id}`);
    
    expect(response.status).toBe(500);
  });

  it('should handle unexpected errors in create endpoint', async () => {
    vi.spyOn(betService, 'createBet').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/bets')
      .send({
        creator: testUserId,
        description: 'Test',
        amount: 100,
      });
    
    expect(response.status).toBe(500);
  });
});
