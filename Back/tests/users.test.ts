import request from 'supertest';
import { describe, it, expect } from 'vitest';
import mongoose from 'mongoose';

import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';

const app = createApp();

describe('Users API', () => {
  it('creates a user with unique email and username', async () => {
    const payload = {
      email: 'alice@example.com',
      username: 'alice',
      password: 'secret123',
    };

    const response = await request(app).post('/api/users').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      email: payload.email,
      username: payload.username,
    });
    expect(response.body).toHaveProperty('id');
    expect(response.body).not.toHaveProperty('passwordHash');

    const stored = await UserModel.findOne({ email: payload.email }).lean();
    expect(stored).toBeTruthy();
    expect(stored?.passwordHash).toBe(payload.password);
  });

  it('rejects duplicate user creation by email with 409', async () => {
    const payload = { email: 'dup@example.com', username: 'dup1', password: 'password123' };
    await request(app).post('/api/users').send(payload);

    const response = await request(app)
      .post('/api/users')
      .send({ ...payload, username: 'dup2' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ message: expect.stringContaining('already exists') });
  });

  it('rejects duplicate user creation by username with 409', async () => {
    await request(app).post('/api/users').send({ email: 'user1@example.com', username: 'dupuser', password: 'password123' });

    const response = await request(app)
      .post('/api/users')
      .send({ email: 'user2@example.com', username: 'dupuser', password: 'password123' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ message: expect.stringContaining('already exists') });
  });

  it('lists existing users without exposing password hash', async () => {
    await UserModel.create({ email: 'bob@example.com', username: 'bob', passwordHash: 'hash' });

    const response = await request(app).get('/api/users');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThanOrEqual(1);
    for (const user of response.body) {
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('username');
      expect(user).not.toHaveProperty('passwordHash');
    }
  });

  it('gets a user by id and returns 404 when not found', async () => {
    const user = await UserModel.create({ email: 'carol@example.com', username: 'carol', passwordHash: 'hash' });

    const found = await request(app).get(`/api/users/${user._id.toString()}`);
    expect(found.status).toBe(200);
    expect(found.body).toMatchObject({ email: 'carol@example.com', username: 'carol', id: user._id.toString() });
    expect(found.body).not.toHaveProperty('passwordHash');

    const invalidId = await request(app).get('/api/users/not-an-id');
    expect(invalidId.status).toBe(400);

    const missing = await request(app).get(`/api/users/${new mongoose.Types.ObjectId().toString()}`);
    expect(missing.status).toBe(404);
  });

  it('validates required fields when creating a user', async () => {
    const response = await request(app).post('/api/users').send({ email: 'missing@example.com' });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: expect.any(String) });
  });

  it('rejects user creation with password shorter than 8 characters', async () => {
    const response = await request(app).post('/api/users').send({
      email: 'short@example.com',
      username: 'shortpass',
      password: '1234567',
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: expect.stringContaining('at least 8 characters') });
  });
});