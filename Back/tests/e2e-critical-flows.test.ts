/**
 * End-to-End Critical Flows Test Suite
 *
 * Tests complete user journeys from registration to event resolution
 * covering all critical business flows:
 *
 * 1. Registration → Login → Dashboard
 * 2. Deposit → Create Event → Place Bet
 * 3. Counter Bet → Matching
 * 4. Evidence Submission → Likes → Curation
 * 5. Event Resolution → Fund Distribution
 * 6. Admin User Management
 * 7. Admin Event Management
 */

import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from '../src/app';
import { UserModel } from '../src/modules/users/model';
import { WalletModel } from '../src/modules/wallet/model';
import { EventModel } from '../src/modules/events/model';
import { EventWagerModel } from '../src/modules/event-wagers/model';
import { EvidenceModel } from '../src/modules/evidence/model';

const app = createApp();

describe('E2E Critical Flows', () => {
  let userAToken: string;
  let userBToken: string;
  let curatorToken: string;
  let adminToken: string;
  let userAId: string;
  let userBId: string;
  let curatorId: string;
  let adminId: string;
  let eventId: string;

  // Helper function to create and login a user
  const createAndLoginUser = async (username: string, email: string, role: string = 'user') => {
    const registerRes = await request(app)
      .post('/api/users/register')
      .send({
        email,
        username,
        password: 'Password123',
      });

    expect(registerRes.status).toBe(201);

    // Update role if not user
    if (role !== 'user') {
      await UserModel.findByIdAndUpdate(registerRes.body.id, {
        role,
        ...(role === 'curator' ? { curatorStatus: 'approved' } : {})
      });
    }

    const loginRes = await request(app)
      .post('/api/users/login')
      .send({
        email,
        password: 'Password123',
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body).toHaveProperty('token');

    return {
      token: loginRes.body.token,
      userId: registerRes.body.id,
    };
  };

  // Helper to deposit funds
  const depositFunds = async (token: string, amount: number) => {
    const res = await request(app)
      .post('/api/wallet/deposit')
      .set('Authorization', `Bearer ${token}`)
      .send({ amount });

    expect(res.status).toBe(200);
    return res.body;
  };

  beforeEach(async () => {
    // Setup test users
    const userA = await createAndLoginUser('userA', 'usera@test.com');
    const userB = await createAndLoginUser('userB', 'userb@test.com');
    const curator = await createAndLoginUser('curator', 'curator@test.com', 'curator');
    const admin = await createAndLoginUser('admin', 'admin@test.com', 'admin');

    userAToken = userA.token;
    userBToken = userB.token;
    curatorToken = curator.token;
    adminToken = admin.token;
    userAId = userA.userId;
    userBId = userB.userId;
    curatorId = curator.userId;
    adminId = admin.userId;
  });

  describe('Flow 1: Registration → Login → Dashboard', () => {
    it('should allow new user to register, login, and access dashboard', async () => {
      const newUser = {
        email: 'newuser@test.com',
        username: 'newuser',
        password: 'SecurePass123',
      };

      // Register
      const registerRes = await request(app)
        .post('/api/users/register')
        .send(newUser);

      expect(registerRes.status).toBe(201);
      expect(registerRes.body).toMatchObject({
        email: newUser.email,
        username: newUser.username,
      });
      expect(registerRes.body).not.toHaveProperty('passwordHash');

      // Login
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({
          email: newUser.email,
          password: newUser.password,
        });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
      expect(loginRes.body).toHaveProperty('user');
      expect(loginRes.body.user.email).toBe(newUser.email);

      // Access protected route (get user details)
      const dashboardRes = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${loginRes.body.token}`);

      expect(dashboardRes.status).toBe(200);
      expect(dashboardRes.body.username).toBe(newUser.username);
    });

    it('should reject duplicate email with 409', async () => {
      const user = {
        email: 'duplicate@test.com',
        username: 'first',
        password: 'Password123',
      };

      await request(app).post('/api/users/register').send(user);

      const duplicateRes = await request(app)
        .post('/api/users/register')
        .send({
          ...user,
          username: 'second',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toContain('already exists');
    });
  });

  describe('Flow 2: Deposit → Create Event → Place Bet', () => {
    it('should allow user to deposit funds, create event, and place bet', async () => {
      // Deposit funds
      const depositRes = await depositFunds(userAToken, 1000);
      expect(depositRes.balance).toBe(1000);

      // Create event
      const eventData = {
        title: 'Test Event',
        description: 'E2E Test Event',
        category: 'Deportes',
        bettingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expectedResolutionDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        resultOptions: ['Yes', 'No'],
      };

      const createEventRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(eventData);

      expect(createEventRes.status).toBe(201);
      expect(createEventRes.body).toMatchObject({
        title: eventData.title,
        status: 'open',
      });

      eventId = createEventRes.body.id;

      // Place bet
      const betData = {
        eventId,
        amount: 100,
        selectedOption: 'Yes',
        type: 'peer',
        requestedOdds: 2.0,
      };

      const betRes = await request(app)
        .post('/api/event-wagers')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(betData);

      expect(betRes.status).toBe(201);
      expect(betRes.body.wager).toMatchObject({
        amount: betData.amount,
        selectedOption: betData.selectedOption,
        status: 'pending',
      });

      // Verify balance deducted
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(walletRes.body.balance).toBe(900); // 1000 - 100
    });
  });

  describe('Flow 3: Counter Bet → Matching', () => {
    beforeEach(async () => {
      // Setup: UserA deposits and creates event with bet
      await depositFunds(userAToken, 1000);

      const eventData = {
        title: 'Matching Test Event',
        description: 'Test matching',
        category: 'Deportes',
        bettingDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        expectedResolutionDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        resultOptions: ['TeamA', 'TeamB'],
      };

      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(eventData);

      eventId = createRes.body.id;

      // UserA places bet
      await request(app)
        .post('/api/event-wagers')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          eventId,
          amount: 200,
          selectedOption: 'TeamA',
          type: 'peer',
          requestedOdds: 2.0,
        });
    });

    it('should match peer-to-peer bets with opposing sides', async () => {
      // UserB deposits and places counter bet
      await depositFunds(userBToken, 1000);

      const counterBetRes = await request(app)
        .post('/api/event-wagers')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          eventId,
          amount: 200,
          selectedOption: 'TeamB',
          type: 'peer',
          requestedOdds: 2.0,
        });

      expect(counterBetRes.status).toBe(201);

      // Verify both bets are matched
      const wagers = await EventWagerModel.find({ eventId });
      const matchedWagers = wagers.filter(w => w.status === 'matched');

      expect(matchedWagers.length).toBe(2);
      expect(matchedWagers[0].matchedWith?.toString()).toBe(matchedWagers[1]._id.toString());
      expect(matchedWagers[1].matchedWith?.toString()).toBe(matchedWagers[0]._id.toString());
    });
  });

  describe('Flow 4: Evidence Submission → Likes → Curation', () => {
    beforeEach(async () => {
      // Create event with past betting deadline
      const pastDeadline = new Date(Date.now() - 1000);
      const evidenceDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const event = await EventModel.create({
        title: 'Evidence Test Event',
        description: 'Test evidence flow',
        category: 'Deportes',
        creator: userAId,
        bettingDeadline: pastDeadline,
        expectedResolutionDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
        evidenceDeadline,
        resultOptions: ['Won', 'Lost'],
        status: 'closed',
        evidenceSubmissionPhase: 'creator',
      });

      eventId = event._id.toString();
    });

    it('should allow creator to submit evidence, users to like it, and curator to curate', async () => {
      // Creator submits evidence
      const evidenceRes = await request(app)
        .post(`/api/events/${eventId}/evidence`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          evidenceType: 'link',
          evidenceUrl: 'https://example.com/proof',
          description: 'Proof of outcome',
          supportedOption: 'Won',
        });

      expect(evidenceRes.status).toBe(201);
      const evidenceId = evidenceRes.body.evidence.id;

      // UserB likes the evidence
      const likeRes = await request(app)
        .post(`/api/events/${eventId}/evidence/${evidenceId}/like`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(likeRes.status).toBe(200);
      expect(likeRes.body.likesCount).toBe(1);

      // Verify evidence has likes
      const evidenceCheckRes = await request(app)
        .get(`/api/events/${eventId}/evidence`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(evidenceCheckRes.body.evidence[0].likesCount).toBe(1);

      // Move to public phase
      await EventModel.findByIdAndUpdate(eventId, {
        evidenceDeadline: new Date(Date.now() - 1000),
        evidenceSubmissionPhase: 'public',
      });

      // Curator gets events ready for curation
      const curationListRes = await request(app)
        .get('/api/events/curation/ready')
        .set('Authorization', `Bearer ${curatorToken}`);

      expect(curationListRes.status).toBe(200);
      expect(curationListRes.body.events.length).toBeGreaterThan(0);

      // Curator resolves event
      const resolveRes = await request(app)
        .post(`/api/events/${eventId}/resolve`)
        .set('Authorization', `Bearer ${curatorToken}`)
        .send({
          winningOption: 'Won',
          resolutionRationale: 'Evidence clearly shows Won outcome',
        });

      expect(resolveRes.status).toBe(200);
      expect(resolveRes.body.event.status).toBe('resolved');
      expect(resolveRes.body.event.winningOption).toBe('Won');
    });
  });

  describe('Flow 5: Event Resolution → Fund Distribution', () => {
    it('should distribute funds correctly after resolution', async () => {
      // Setup: Create event and matched bets
      await depositFunds(userAToken, 1000);
      await depositFunds(userBToken, 1000);

      const eventData = {
        title: 'Distribution Test',
        description: 'Test fund distribution',
        category: 'Deportes',
        bettingDeadline: new Date(Date.now() + 1000).toISOString(),
        expectedResolutionDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        resultOptions: ['Win', 'Lose'],
      };

      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(eventData);

      eventId = createRes.body.id;

      // UserA bets 100 on Win
      await request(app)
        .post('/api/event-wagers')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          eventId,
          amount: 100,
          selectedOption: 'Win',
          type: 'peer',
          requestedOdds: 2.0,
        });

      // UserB bets 100 on Lose
      await request(app)
        .post('/api/event-wagers')
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          eventId,
          amount: 100,
          selectedOption: 'Lose',
          type: 'peer',
          requestedOdds: 2.0,
        });

      // Wait for betting deadline to pass
      await new Promise(resolve => setTimeout(resolve, 1100));

      // Admin resolves event - UserA wins
      const resolveRes = await request(app)
        .post(`/api/events/${eventId}/resolve`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          winningOption: 'Win',
          resolutionRationale: 'Win outcome confirmed',
        });

      expect(resolveRes.status).toBe(200);

      // Check balances
      const userAWalletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      const userBWalletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userBToken}`);

      // UserA should have: 900 (initial after bet) + winnings
      // UserB should have: 900 (lost 100)
      expect(userAWalletRes.body.balance).toBeGreaterThan(900);
      expect(userBWalletRes.body.balance).toBe(900);
    });
  });

  describe('Flow 6: Admin User Management', () => {
    it('should allow admin to search, ban, and change user roles', async () => {
      // Search users
      const searchRes = await request(app)
        .get('/api/users/search')
        .query({ search: 'userA' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(searchRes.status).toBe(200);
      expect(searchRes.body.users.length).toBeGreaterThan(0);
      expect(searchRes.body.users[0].username).toContain('userA');

      // Ban user
      const banRes = await request(app)
        .post(`/api/users/${userAId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Testing ban functionality',
        });

      expect(banRes.status).toBe(200);
      expect(banRes.body.user.isBanned).toBe(true);

      // Verify banned user cannot access protected routes
      const accessRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(accessRes.status).toBe(403);
      expect(accessRes.body.message).toContain('banned');

      // Unban user
      const unbanRes = await request(app)
        .post(`/api/users/${userAId}/unban`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(unbanRes.status).toBe(200);
      expect(unbanRes.body.user.isBanned).toBe(false);

      // Change user role to curator
      const roleRes = await request(app)
        .patch(`/api/users/${userBId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          role: 'curator',
          curatorStatus: 'approved',
        });

      expect(roleRes.status).toBe(200);
      expect(roleRes.body.user.role).toBe('curator');
      expect(roleRes.body.user.curatorStatus).toBe('approved');
    });

    it('should show list of banned users', async () => {
      // Ban a user first
      await request(app)
        .post(`/api/users/${userAId}/ban`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Test ban' });

      // Get banned users list
      const bannedRes = await request(app)
        .get('/api/users/banned')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(bannedRes.status).toBe(200);
      expect(bannedRes.body.users.length).toBeGreaterThan(0);
      expect(bannedRes.body.users.some((u: any) => u.id === userAId)).toBe(true);
    });
  });

  describe('Flow 7: Admin Event Management', () => {
    beforeEach(async () => {
      await depositFunds(userAToken, 500);
      await depositFunds(userBToken, 500);

      const eventData = {
        title: 'Admin Test Event',
        description: 'Event for admin tests',
        category: 'Política',
        bettingDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        expectedResolutionDate: new Date(Date.now() + 96 * 60 * 60 * 1000).toISOString(),
        resultOptions: ['OptionA', 'OptionB'],
      };

      const createRes = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${userAToken}`)
        .send(eventData);

      eventId = createRes.body.id;

      // Place some bets
      await request(app)
        .post('/api/event-wagers')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          eventId,
          amount: 50,
          selectedOption: 'OptionA',
          type: 'peer',
          requestedOdds: 2.0,
        });
    });

    it('should allow admin to cancel event and refund participants', async () => {
      const cancelRes = await request(app)
        .post(`/api/events/${eventId}/cancel`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Event cancelled for testing',
        });

      expect(cancelRes.status).toBe(200);
      expect(cancelRes.body.event.status).toBe('cancelled');

      // Verify event is cancelled
      const eventRes = await request(app)
        .get(`/api/events/${eventId}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(eventRes.body.status).toBe('cancelled');

      // Verify refund was processed (balance should be back to 500)
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(walletRes.body.balance).toBe(500);
    });

    it('should allow admin to modify event dates', async () => {
      const newDeadline = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
      const newResolution = new Date(Date.now() + 120 * 60 * 60 * 1000).toISOString();

      const modifyRes = await request(app)
        .patch(`/api/events/${eventId}/dates`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bettingDeadline: newDeadline,
          expectedResolutionDate: newResolution,
        });

      expect(modifyRes.status).toBe(200);
      expect(new Date(modifyRes.body.event.bettingDeadline).getTime())
        .toBeCloseTo(new Date(newDeadline).getTime(), -3);
    });

    it('should filter events by status', async () => {
      const filterRes = await request(app)
        .get('/api/events')
        .query({ status: 'open' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(filterRes.status).toBe(200);
      expect(Array.isArray(filterRes.body)).toBe(true);
      expect(filterRes.body.every((e: any) => e.status === 'open')).toBe(true);
    });
  });

  describe('Flow 8: Transaction History', () => {
    it('should record all transactions and maintain accurate balance', async () => {
      // Deposit
      await depositFunds(userAToken, 1000);

      // Withdraw
      await request(app)
        .post('/api/wallet/withdraw')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 200 });

      // Check transaction history
      const historyRes = await request(app)
        .get('/api/wallet/transactions')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(historyRes.status).toBe(200);
      expect(historyRes.body.transactions.length).toBeGreaterThanOrEqual(2);

      const types = historyRes.body.transactions.map((t: any) => t.type);
      expect(types).toContain('deposit');
      expect(types).toContain('withdraw');

      // Verify final balance
      const walletRes = await request(app)
        .get('/api/wallet')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(walletRes.body.balance).toBe(800);
    });
  });
});
