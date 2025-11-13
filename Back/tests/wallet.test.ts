import request from 'supertest';
import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';
import { WalletModel } from '../src/modules/wallet/model';

const app = createApp();

describe('Wallet API', () => {
  it('automatically creates a wallet when a user is registered', async () => {
    const user = await UserModel.create({
      email: 'auto-wallet@example.com',
      username: 'auto-wallet-user',
      passwordHash: 'hash'
    });

    // Wait a bit for the post-save hook to execute
    await new Promise(resolve => setTimeout(resolve, 150));

    // Verify wallet was created automatically
    const wallet = await WalletModel.findOne({ user: user._id }).lean();
    expect(wallet).toBeTruthy();
    expect(wallet?.balanceAvailable).toBe(0);
    expect(wallet?.balanceBlocked).toBe(0);
    expect(wallet?.balance).toBe(0);
    expect(wallet?.lastUpdated).toBeTruthy();

    // Verify wallet can be retrieved via API
    const response = await request(app).get(`/api/wallet/${user._id.toString()}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: user._id.toString(),
      balanceAvailable: 0,
      balanceBlocked: 0,
      balance: 0
    });
  });

  it('creates a wallet for a user and prevents duplicates', async () => {
    const user = await UserModel.create({ email: 'wallet@example.com', username: 'wallet-user', passwordHash: 'hash' });

    // Wait a bit for the post-save hook to create the wallet automatically
    await new Promise(resolve => setTimeout(resolve, 150));

    // The wallet was already created by the hook, so trying to create another should fail
    const response = await request(app).post('/api/wallet').send({ user: user._id.toString(), balance: 100 });
    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ message: expect.stringContaining('already exists') });

    // Verify the auto-created wallet still has initial values
    const stored = await WalletModel.findOne({ user: user._id }).lean();
    expect(stored).toBeTruthy();
    expect(stored?.balanceAvailable).toBe(0);
    expect(stored?.balanceBlocked).toBe(0);
  });

  it('retrieves wallet by user id or returns 404', async () => {
    const user = await UserModel.create({ email: 'wallet2@example.com', username: 'wallet-user-2', passwordHash: 'hash' });

    // Wait for auto-created wallet and update it
    await new Promise(resolve => setTimeout(resolve, 150));
    await WalletModel.findOneAndUpdate(
      { user: user._id },
      { balanceAvailable: 50, balance: 50 },
      { upsert: true }
    );

    const response = await request(app).get(`/api/wallet/${user._id.toString()}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      user: user._id.toString(),
      balance: 50,
      balanceAvailable: 50,
      balanceBlocked: 0,
      id: expect.any(String)
    });
    expect(response.body).toHaveProperty('lastUpdated');
    expect(response.body).not.toHaveProperty('_id');

    const missing = await request(app).get(`/api/wallet/${new mongoose.Types.ObjectId().toString()}`);
    expect(missing.status).toBe(404);
  });

  it('updates wallet balance', async () => {
    const user = await UserModel.create({ email: 'wallet3@example.com', username: 'wallet-user-3', passwordHash: 'hash' });

    // Wait for auto-created wallet and update it
    await new Promise(resolve => setTimeout(resolve, 150));
    await WalletModel.findOneAndUpdate(
      { user: user._id },
      { balanceAvailable: 35, balance: 35 },
      { upsert: true }
    );

    const response = await request(app)
      .put(`/api/wallet/${user._id.toString()}/balance`)
      .send({ balance: 80 });
    expect(response.status).toBe(200);
    expect(response.body.balance).toBe(80);
    expect(response.body.balanceAvailable).toBe(80);
    expect(response.body).toHaveProperty('lastUpdated');
    expect(response.body).not.toHaveProperty('_id');

    const stored = await WalletModel.findOne({ user: user._id }).lean();
    expect(stored?.balance).toBe(80);
    expect(stored?.balanceAvailable).toBe(80);
  });

  it('returns 404 when updating a non-existing wallet', async () => {
    const response = await request(app)
      .put(`/api/wallet/${new mongoose.Types.ObjectId().toString()}/balance`)
      .send({ balance: 40 });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ message: expect.stringContaining('Wallet not found') });
  });

  it('validates payloads', async () => {
    const response = await request(app).post('/api/wallet').send({});
    expect(response.status).toBe(400);

    const invalidUserId = await request(app).post('/api/wallet').send({ user: 'invalid', balance: 10 });
    expect(invalidUserId.status).toBe(400);

    const invalidUpdate = await request(app)
      .put(`/api/wallet/${new mongoose.Types.ObjectId().toString()}/balance`)
      .send({ balance: 'invalid' });
    expect(invalidUpdate.status).toBe(400);

    const negativeBalance = await request(app)
      .put(`/api/wallet/${new mongoose.Types.ObjectId().toString()}/balance`)
      .send({ balance: -10 });
    expect(negativeBalance.status).toBe(400);

    const invalidPathId = await request(app).get('/api/wallet/not-an-id');
    expect(invalidPathId.status).toBe(400);
  });
});
