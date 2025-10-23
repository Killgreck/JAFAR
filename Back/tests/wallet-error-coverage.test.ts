import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/model';
import { WalletModel } from '../src/modules/wallet/model';
import * as walletService from '../src/modules/wallet/service';

describe('Wallet Controller - Error Coverage', () => {
  const app = createApp();
  let testUserId: string;

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await WalletModel.deleteMany({});
    await UserModel.deleteMany({});

    const user = await UserModel.create({
      email: 'test@test.com',
      username: 'testuser',
      passwordHash: 'password',
    });
    testUserId = user._id.toString();
    
    vi.restoreAllMocks();
  });

  it('should handle unexpected errors in getByUser endpoint', async () => {
    await WalletModel.create({
      user: testUserId,
      balance: 100,
    });

    vi.spyOn(walletService, 'getWalletByUser').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get(`/api/wallet/${testUserId}`);
    
    expect(response.status).toBe(500);
  });

  it('should handle unexpected errors in create endpoint (non-conflict)', async () => {
    vi.spyOn(walletService, 'createWallet').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/wallet')
      .send({
        user: testUserId,
        balance: 100,
      });
    
    expect(response.status).toBe(500);
  });

  it('should handle unexpected errors in updateBalance endpoint', async () => {
    await WalletModel.create({
      user: testUserId,
      balance: 100,
    });

    vi.spyOn(walletService, 'updateWalletBalance').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .put(`/api/wallet/${testUserId}/balance`)
      .send({
        balance: 200,
      });
    
    expect(response.status).toBe(500);
  });
});
