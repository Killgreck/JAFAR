import request from 'supertest';
import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';
import { WalletModel } from '../src/modules/wallet/model';

const app = createApp();

describe('Wallet API', () => {
  it('creates a wallet for a user and prevents duplicates', async () => {
    const user = await UserModel.create({ email: 'wallet@example.com', username: 'wallet-user', passwordHash: 'hash' });

    const response = await request(app).post('/api/wallet').send({ user: user._id.toString(), balance: 100 });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ user: user._id.toString(), balance: 100 });
    expect(response.body).toHaveProperty('id');
    expect(response.body).not.toHaveProperty('_id');

    const second = await request(app).post('/api/wallet').send({ user: user._id.toString(), balance: 200 });
    expect(second.status).toBe(409);
    expect(second.body).toMatchObject({ message: expect.stringContaining('already exists') });

    const stored = await WalletModel.findOne({ user: user._id }).lean();
    expect(stored).toBeTruthy();
    expect(stored?.balance).toBe(100);
  });

  it('retrieves wallet by user id or returns 404', async () => {
    const user = await UserModel.create({ email: 'wallet2@example.com', username: 'wallet-user-2', passwordHash: 'hash' });
    await WalletModel.create({ user: user._id, balance: 50 });

    const response = await request(app).get(`/api/wallet/${user._id.toString()}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ user: user._id.toString(), balance: 50, id: expect.any(String) });
    expect(response.body).not.toHaveProperty('_id');

    const missing = await request(app).get(`/api/wallet/${new mongoose.Types.ObjectId().toString()}`);
    expect(missing.status).toBe(404);
  });

  it('updates wallet balance', async () => {
    const user = await UserModel.create({ email: 'wallet3@example.com', username: 'wallet-user-3', passwordHash: 'hash' });
    await WalletModel.create({ user: user._id, balance: 35 });

    const response = await request(app)
      .put(`/api/wallet/${user._id.toString()}/balance`)
      .send({ balance: 80 });
    expect(response.status).toBe(200);
    expect(response.body.balance).toBe(80);
    expect(response.body).not.toHaveProperty('_id');

    const stored = await WalletModel.findOne({ user: user._id }).lean();
    expect(stored?.balance).toBe(80);
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
