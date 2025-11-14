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

    const response = await request(app).post('/api/users/register').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toMatchObject({
      email: payload.email,
      username: payload.username,
    });
    expect(response.body.user).toHaveProperty('id');
    expect(response.body.user).not.toHaveProperty('passwordHash');

    const stored = await UserModel.findOne({ email: payload.email }).lean();
    expect(stored).toBeTruthy();
    expect(stored?.passwordHash).not.toBe(payload.password); // Should be hashed
  });

  it('rejects duplicate user creation by email with 409', async () => {
    const payload = { email: 'dup@example.com', username: 'dup1', password: 'password123' };
    await request(app).post('/api/users/register').send(payload);

    const response = await request(app)
      .post('/api/users/register')
      .send({ ...payload, username: 'dup2' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ message: expect.stringContaining('already exists') });
  });

  it('rejects duplicate user creation by username with 409', async () => {
    await request(app).post('/api/users/register').send({ email: 'user1@example.com', username: 'dupuser', password: 'password123' });

    const response = await request(app)
      .post('/api/users/register')
      .send({ email: 'user2@example.com', username: 'dupuser', password: 'password123' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ message: expect.stringContaining('already exists') });
  });

  it('gets authenticated user profile without exposing password hash', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: 'bob@example.com',
      username: 'bob',
      password: 'password123',
    });

    const token = registerRes.body.token;

    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
    expect(response.body).toHaveProperty('email');
    expect(response.body).toHaveProperty('username');
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.body.email).toBe('bob@example.com');
  });

  it('gets a user by id and returns 404 when not found', async () => {
    const registerRes = await request(app).post('/api/users/register').send({
      email: 'carol@example.com',
      username: 'carol',
      password: 'password123',
    });

    const userId = registerRes.body.user.id;
    const token = registerRes.body.token;

    const found = await request(app)
      .get(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(found.status).toBe(200);
    expect(found.body).toMatchObject({ email: 'carol@example.com', username: 'carol', id: userId });
    expect(found.body).not.toHaveProperty('passwordHash');

    const invalidId = await request(app)
      .get('/api/users/not-an-id')
      .set('Authorization', `Bearer ${token}`);
    expect(invalidId.status).toBe(400);

    const missing = await request(app)
      .get(`/api/users/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(403); // Can only view own profile
  });

  it('validates required fields when creating a user', async () => {
    const response = await request(app).post('/api/users/register').send({ email: 'missing@example.com' });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: expect.any(String) });
  });

  it('rejects user creation with password shorter than 8 characters', async () => {
    const response = await request(app).post('/api/users/register').send({
      email: 'short@example.com',
      username: 'shortpass',
      password: '1234567',
    });
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ message: expect.stringContaining('at least 8 characters') });
  });
});