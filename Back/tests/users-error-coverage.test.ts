import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/model';
import * as userService from '../src/modules/users/service';

describe('Users Controller - Error Coverage', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
    vi.restoreAllMocks();
  });

  it('should handle unexpected errors in list endpoint', async () => {
    vi.spyOn(userService, 'listUsers').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get('/api/users');
    
    expect(response.status).toBe(500);
  });

  it('should handle unexpected errors in getById endpoint', async () => {
    const user = await UserModel.create({
      email: 'test@test.com',
      username: 'testuser',
      passwordHash: 'password',
    });

    vi.spyOn(userService, 'getUserById').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app).get(`/api/users/${user._id}`);
    
    expect(response.status).toBe(500);
  });

  it('should handle unexpected errors in create endpoint (non-duplicate)', async () => {
    vi.spyOn(userService, 'createUser').mockRejectedValueOnce(new Error('Database error'));

    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'test@test.com',
        username: 'testuser',
        password: 'password',
      });
    
    expect(response.status).toBe(500);
  });
});
