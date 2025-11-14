import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';

const app = createApp();

describe('User Authentication - Rate Limiting', () => {
  const testUser = {
    email: 'ratelimit@test.com',
    username: 'ratelimituser',
    password: 'CorrectPassword123',
  };

  beforeEach(async () => {
    // Create test user
    await request(app).post('/api/users/register').send(testUser);
  });

  it('should lock account after 5 failed login attempts', async () => {
    // Attempt 5 failed logins
    for (let i = 0; i < 5; i++) {
      const res = await request(app)
        .post('/api/users/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        });

      if (i < 4) {
        // First 4 attempts should return 401
        expect(res.status).toBe(401);
        expect(res.body.message).toContain('Invalid');
      } else {
        // 5th attempt should trigger lock with 429
        expect(res.status).toBe(429);
        expect(res.body.message).toContain('locked');
        expect(res.body.message).toMatch(/\d+ minute/);
        expect(res.body.error).toBe('ACCOUNT_LOCKED');
      }
    }

    // Verify user is locked in database
    const user = await UserModel.findOne({ email: testUser.email });
    expect(user).toBeTruthy();
    expect(user!.lockUntil).toBeTruthy();
    expect(user!.lockUntil!.getTime()).toBeGreaterThan(Date.now());
  });

  it('should prevent login while account is locked', async () => {
    // Trigger lock
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'Wrong' });
    }

    // Try to login with correct password while locked
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(429);
    expect(res.body.message).toContain('locked');
  });

  it('should reset login attempts after successful login', async () => {
    // Make 3 failed attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'Wrong' });
    }

    // Verify attempts recorded
    let user = await UserModel.findOne({ email: testUser.email });
    expect(user!.loginAttempts).toBe(3);

    // Successful login
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();

    // Verify attempts reset
    user = await UserModel.findOne({ email: testUser.email });
    expect(user!.loginAttempts).toBe(0);
    expect(user!.lockUntil).toBeUndefined();
  });

  it('should unlock account after 15 minutes', async () => {
    // Trigger lock
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'Wrong' });
    }

    // Manually set lockUntil to past time (simulate 15 minutes passed)
    await UserModel.findOneAndUpdate(
      { email: testUser.email },
      { lockUntil: new Date(Date.now() - 1000) } // 1 second in the past
    );

    // Should be able to login now
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('should not reveal user existence through rate limiting', async () => {
    // Try to login with non-existent email
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: 'nonexistent@test.com',
        password: 'SomePassword',
      });

    // Should return same 401 as wrong password, not rate limit error
    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Invalid');
  });

  it('should track attempts per user, not globally', async () => {
    // Create second user
    const user2 = {
      email: 'user2@test.com',
      username: 'user2',
      password: 'Password123',
    };
    await request(app).post('/api/users/register').send(user2);

    // Make 4 failed attempts for user1
    for (let i = 0; i < 4; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'Wrong' });
    }

    // User2 should still be able to login
    const res = await request(app)
      .post('/api/users/login')
      .send({
        email: user2.email,
        password: user2.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('should increment attempts counter correctly', async () => {
    // Make 3 failed attempts
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'Wrong' });

      const user = await UserModel.findOne({ email: testUser.email });
      expect(user!.loginAttempts).toBe(i + 1);
    }
  });

  it('should reset attempts counter to 0 after lock', async () => {
    // Trigger lock (5 attempts)
    for (let i = 0; i < 5; i++) {
      await request(app)
        .post('/api/users/login')
        .send({ email: testUser.email, password: 'Wrong' });
    }

    // After 5th attempt, loginAttempts should be reset to 0
    const user = await UserModel.findOne({ email: testUser.email });
    expect(user!.loginAttempts).toBe(0);
    expect(user!.lockUntil).toBeTruthy();
  });
});
