import request from 'supertest';
import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';
import { BetModel } from '../src/modules/bets/model';

const app = createApp();

describe('Bets API', () => {
  it('creates a bet with creator and optional opponent', async () => {
    const creator = await UserModel.create({ email: 'creator@example.com', username: 'creator', passwordHash: 'hash' });
    const opponent = await UserModel.create({ email: 'opponent@example.com', username: 'opponent', passwordHash: 'hash' });

    const response = await request(app)
      .post('/api/bets')
      .send({
        creator: creator._id.toString(),
        opponent: opponent._id.toString(),
        description: 'Bet on event',
        amount: 150,
      });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      creator: creator._id.toString(),
      opponent: opponent._id.toString(),
      description: 'Bet on event',
      amount: 150,
      status: 'open',
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body).not.toHaveProperty('_id');

    const stored = await BetModel.findById(response.body.id).lean();
    expect(stored).toBeTruthy();
    expect(stored?.amount).toBe(150);
  });

  it('lists bets including previously created ones without internal fields', async () => {
    const creator = await UserModel.create({ email: 'list@example.com', username: 'list-user', passwordHash: 'hash' });
    await BetModel.create({ creator: creator._id, description: 'Another bet', amount: 75, status: 'open' });

    const response = await request(app).get('/api/bets');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    for (const bet of response.body) {
      expect(bet).toHaveProperty('id');
      expect(bet).toHaveProperty('creator');
      expect(bet).not.toHaveProperty('_id');
    }
  });

  it('fetches a bet by id and handles invalid or missing bets', async () => {
    const creator = await UserModel.create({ email: 'getbet@example.com', username: 'getbet', passwordHash: 'hash' });
    const bet = await BetModel.create({ creator: creator._id, description: 'Specific bet', amount: 20 });

    const response = await request(app).get(`/api/bets/${bet._id.toString()}`);
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ description: 'Specific bet', amount: 20, id: bet._id.toString() });
    expect(response.body).not.toHaveProperty('_id');

    const invalidId = await request(app).get('/api/bets/not-an-id');
    expect(invalidId.status).toBe(400);

    const missing = await request(app).get(`/api/bets/${new mongoose.Types.ObjectId().toString()}`);
    expect(missing.status).toBe(404);
  });

  it('validates payload when creating a bet', async () => {
    const response = await request(app).post('/api/bets').send({ description: 'Missing creator', amount: 10 });
    expect(response.status).toBe(400);

    const invalidAmount = await request(app)
      .post('/api/bets')
      .send({ creator: new mongoose.Types.ObjectId().toString(), description: 'Invalid amount', amount: 'abc' });
    expect(invalidAmount.status).toBe(400);

    const negativeAmount = await request(app)
      .post('/api/bets')
      .send({ creator: new mongoose.Types.ObjectId().toString(), description: 'Negative amount', amount: -5 });
    expect(negativeAmount.status).toBe(400);

    const invalidOpponent = await request(app)
      .post('/api/bets')
      .send({
        creator: new mongoose.Types.ObjectId().toString(),
        opponent: 'not-object-id',
        description: 'Invalid opponent',
        amount: 10,
      });
    expect(invalidOpponent.status).toBe(400);
  });
});
