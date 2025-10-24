import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectToDatabase, disconnectFromDatabase } from '../src/config/database';
import { UserModel } from '../src/modules/users/model';

describe('Users API - Extended Coverage', () => {
  const app = createApp();

  beforeAll(async () => {
    await connectToDatabase();
  });

  afterAll(async () => {
    await disconnectFromDatabase();
  });

  beforeEach(async () => {
    await UserModel.deleteMany({});
  });

  describe('POST /api/users - Error handling', () => {
    it('should reject user without email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          username: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });

    it('should reject user without username', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('username');
    });

    it('should reject user without password', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('password');
    });

    it('should reject user with empty email', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: '',
          username: 'testuser',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject user with empty username', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          username: '',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject user with empty password', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: '',
        });

      expect(response.status).toBe(400);
    });

    it('should return 409 for duplicate email', async () => {
      await UserModel.create({
        email: 'duplicate@test.com',
        username: 'user1',
        passwordHash: 'password123',
      });

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'duplicate@test.com',
          username: 'user2',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 409 for duplicate username', async () => {
      await UserModel.create({
        email: 'user1@test.com',
        username: 'duplicateuser',
        passwordHash: 'password123',
      });

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'user2@test.com',
          username: 'duplicateuser',
          password: 'password123',
        });

      expect(response.status).toBe(409);
      expect(response.body.message).toContain('already exists');
    });

    it('should not expose password in response', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'secure@test.com',
          username: 'secureuser',
          password: 'secretpassword',
        });

      expect(response.status).toBe(201);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should reject password with less than 8 characters', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'short@test.com',
          username: 'shortuser',
          password: '1234567',
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('at least 8 characters');
    });

    it('should accept password with exactly 8 characters', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'valid@test.com',
          username: 'validuser',
          password: '12345678',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('valid@test.com');
    });

    it('should accept password with more than 8 characters', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'long@test.com',
          username: 'longuser',
          password: 'verylongpassword123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.email).toBe('long@test.com');
    });
  });

  describe('GET /api/users - Error handling', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should not expose passwords in list', async () => {
      await UserModel.create({
        email: 'user1@test.com',
        username: 'user1',
        passwordHash: 'password123',
      });

      const response = await request(app).get('/api/users');
      expect(response.status).toBe(200);
      expect(response.body[0]).not.toHaveProperty('password');
      expect(response.body[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('GET /api/users/:id - Error handling', () => {
    it('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app).get('/api/users/invalid-id');
      expect(response.status).toBe(400);
      expect(response.body.message).toContain('valid identifier');
    });

    it('should return 404 for non-existent user', async () => {
      const nonExistentId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/users/${nonExistentId}`);
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('User not found');
    });

    it('should not expose password in single user response', async () => {
      const user = await UserModel.create({
        email: 'single@test.com',
        username: 'singleuser',
        passwordHash: 'password123',
      });

      const response = await request(app).get(`/api/users/${user._id}`);
      expect(response.status).toBe(200);
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
    });

    it('should return user with timestamps', async () => {
      const user = await UserModel.create({
        email: 'timestamps@test.com',
        username: 'timestampuser',
        passwordHash: 'password123',
      });

      const response = await request(app).get(`/api/users/${user._id}`);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });
});
