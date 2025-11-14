import { describe, it, expect, beforeEach } from 'vitest';
import { UserModel } from '../src/modules/users/model';
import { EventModel } from '../src/modules/events/model';
import { WalletModel } from '../src/modules/wallet/model';
import { EvidenceModel } from '../src/modules/evidence/model';
import { CuratorRequestModel } from '../src/modules/curators/model';
import * as userService from '../src/modules/users/service';
import * as eventService from '../src/modules/events/service';
import * as evidenceService from '../src/modules/evidence/service';
import * as eventWagersService from '../src/modules/event-wagers/service';
import * as curatorService from '../src/modules/curators/service';
import bcrypt from 'bcryptjs';

describe('Evidence and Curator Commission Flow', () => {
  let creatorId: string;
  let bettorId: string;
  let curatorId: string;
  let adminId: string;
  let eventId: string;
  let creatorToken: string;
  let bettorToken: string;
  let curatorToken: string;

  beforeEach(async () => {
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await UserModel.create({
      email: 'admin@jafar.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: 'admin',
    });
    adminId = admin._id.toString();

    // Create creator user
    const creatorPassword = await bcrypt.hash('creator123', 10);
    const creator = await UserModel.create({
      email: 'creator@test.com',
      username: 'creator',
      passwordHash: creatorPassword,
    });
    creatorId = creator._id.toString();

    // Wait for wallet to be created by post-save hook, then update balance
    await new Promise(resolve => setTimeout(resolve, 100));
    await WalletModel.findOneAndUpdate(
      { user: creatorId },
      { balanceAvailable: 1000, balanceBlocked: 0 },
      { upsert: true }
    );

    // Create bettor user
    const bettorPassword = await bcrypt.hash('bettor123', 10);
    const bettor = await UserModel.create({
      email: 'bettor@test.com',
      username: 'bettor',
      passwordHash: bettorPassword,
    });
    bettorId = bettor._id.toString();

    // Wait for wallet to be created by post-save hook, then update balance
    await new Promise(resolve => setTimeout(resolve, 100));
    await WalletModel.findOneAndUpdate(
      { user: bettorId },
      { balanceAvailable: 500, balanceBlocked: 0 },
      { upsert: true }
    );

    // Create curator user
    const curatorPassword = await bcrypt.hash('curator123', 10);
    const curatorUser = await UserModel.create({
      email: 'curator@test.com',
      username: 'curator',
      passwordHash: curatorPassword,
      role: 'curator',
      curatorStatus: 'approved',
      curatorApprovedBy: admin._id,
      curatorApprovedAt: new Date(),
    });
    curatorId = curatorUser._id.toString();

    // Wallet is created automatically by post-save hook with 0 balance

    // Create curator request (approved)
    await CuratorRequestModel.create({
      user: curatorId,
      reason: 'I want to be a curator because I have extensive experience in event management and verification',
      experience: 'I have 5 years of experience working with betting platforms and event verification',
      status: 'approved',
      reviewedBy: adminId,
      reviewedAt: new Date(),
    });
  });

  it('should complete full flow: create event → place bets → submit evidence → curator resolves with commission', async () => {
    // STEP 1: Creator creates an event
    const now = new Date();
    const bettingDeadline = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
    const expectedResolutionDate = new Date(now.getTime() + 3 * 60 * 60 * 1000); // 3 hours from now

    const event = await eventService.createEvent({
      creator: creatorId,
      title: 'Test Event for Evidence Flow',
      description: 'This is a test event to verify the evidence and curator commission flow',
      category: 'Deportes',
      bettingDeadline,
      expectedResolutionDate,
      resultOptions: ['Option A', 'Option B', 'Option C'],
    });

    eventId = event._id.toString();

    // Verify evidence deadline was auto-calculated (betting deadline + 24 hours)
    expect(event.evidenceDeadline).toBeDefined();
    const expectedEvidenceDeadline = new Date(bettingDeadline.getTime() + 24 * 60 * 60 * 1000);
    expect(event.evidenceDeadline!.getTime()).toBe(expectedEvidenceDeadline.getTime());

    // STEP 2: Multiple bettors place wagers
    // Bettor 1 bets 100 on Option A
    await eventWagersService.placeEventWager(bettorId, eventId, 'Option A', 100);

    // Creator bets 200 on Option B
    await eventWagersService.placeEventWager(creatorId, eventId, 'Option B', 200);

    // Bettor 1 bets another 150 on Option A
    await eventWagersService.placeEventWager(bettorId, eventId, 'Option A', 150);

    // Total pool: 100 + 200 + 150 = 450
    // Option A pool: 250
    // Option B pool: 200

    // Verify wallets updated correctly
    const bettorWallet = await WalletModel.findOne({ user: bettorId });
    expect(bettorWallet!.balanceAvailable).toBe(250); // 500 - 250
    expect(bettorWallet!.balanceBlocked).toBe(250); // 100 + 150

    const creatorWallet = await WalletModel.findOne({ user: creatorId });
    expect(creatorWallet!.balanceAvailable).toBe(800); // 1000 - 200
    expect(creatorWallet!.balanceBlocked).toBe(200);

    // STEP 3: Try to submit evidence before betting deadline (should fail)
    await expect(
      evidenceService.createEvidence({
        eventId,
        submittedBy: creatorId,
        evidenceType: 'link',
        evidenceUrl: 'https://example.com/early-evidence',
        description: 'Trying to submit before deadline',
        supportedOption: 'Option A',
      })
    ).rejects.toThrow('Cannot submit evidence before betting deadline');

    // STEP 4: Simulate betting deadline passed - update event manually for testing
    const eventDoc = await EventModel.findById(eventId);
    eventDoc!.bettingDeadline = new Date(now.getTime() - 1000); // 1 second ago
    eventDoc!.evidenceDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
    await eventDoc!.save();

    // STEP 5: Creator submits evidence (within 24 hours)
    const creatorEvidence = await evidenceService.createEvidence({
      eventId,
      submittedBy: creatorId,
      evidenceType: 'link',
      evidenceUrl: 'https://example.com/result-proof',
      description: 'Official result showing Option A won',
      supportedOption: 'Option A',
    });

    expect(creatorEvidence.submitterRole).toBe('creator');
    expect(creatorEvidence.supportedOption).toBe('Option A');

    // STEP 6: Try public submission during creator phase (should fail)
    await expect(
      evidenceService.createEvidence({
        eventId,
        submittedBy: bettorId,
        evidenceType: 'text',
        content: 'Public trying to submit during creator phase',
        description: 'Should not be allowed',
        supportedOption: 'Option B',
      })
    ).rejects.toThrow('Only the event creator can submit evidence during the first 24 hours');

    // STEP 7: Simulate evidence deadline passed (public phase)
    eventDoc!.evidenceDeadline = new Date(now.getTime() - 1000); // 1 second ago
    await eventDoc!.save();

    // STEP 8: Public submits evidence
    const publicEvidence = await evidenceService.createEvidence({
      eventId,
      submittedBy: bettorId,
      evidenceType: 'text',
      content: 'I witnessed the event and Option A definitely won',
      description: 'Eyewitness account confirming Option A victory',
      supportedOption: 'Option A',
    });

    expect(publicEvidence.submitterRole).toBe('public');

    // STEP 9: Verify all evidence can be retrieved
    const allEvidence = await evidenceService.getEvidenceByEventId(eventId);
    expect(allEvidence).toHaveLength(2);
    expect(allEvidence[0].submitterRole).toBe('creator');
    expect(allEvidence[1].submitterRole).toBe('public');

    // STEP 10: Curator resolves the event with evidence and rationale
    const curatorWalletBefore = await WalletModel.findOne({ user: curatorId });
    expect(curatorWalletBefore!.balanceAvailable).toBe(0);

    const settlement = await eventWagersService.settleEvent(
      eventId,
      'Option A',
      curatorId,
      creatorEvidence._id.toString(),
      'Based on the creator evidence and public confirmation, Option A is the clear winner'
    );

    // STEP 11: Verify settlement results
    expect(settlement.totalPool).toBe(450);
    expect(settlement.curatorCommission).toBe(450 * 0.005); // 2.25
    expect(settlement.distributionPool).toBe(450 * 0.995); // 447.75
    expect(settlement.winnersCount).toBe(2); // Bettor placed 2 bets on Option A

    // STEP 12: Verify curator received commission
    const curatorWalletAfter = await WalletModel.findOne({ user: curatorId });
    expect(curatorWalletAfter!.balanceAvailable).toBe(2.25);

    // STEP 13: Verify winners received correct payouts
    // Bettor bet 250 on Option A (100 + 150)
    // Winner pool: 250
    // Bettor's share: (250 / 250) * 447.75 = 447.75
    const bettorWalletAfter = await WalletModel.findOne({ user: bettorId });
    expect(bettorWalletAfter!.balanceAvailable).toBeCloseTo(250 + 447.75, 2); // 697.75
    expect(bettorWalletAfter!.balanceBlocked).toBe(0);

    // STEP 14: Verify creator (who lost) has funds released
    const creatorWalletAfter = await WalletModel.findOne({ user: creatorId });
    expect(creatorWalletAfter!.balanceAvailable).toBe(800); // No winnings
    expect(creatorWalletAfter!.balanceBlocked).toBe(0); // Released

    // STEP 15: Verify event was updated correctly
    const resolvedEvent = await EventModel.findById(eventId);
    expect(resolvedEvent!.status).toBe('resolved');
    expect(resolvedEvent!.winningOption).toBe('Option A');
    expect(resolvedEvent!.resolvedBy!.toString()).toBe(curatorId);
    expect(resolvedEvent!.resolutionRationale).toBe(
      'Based on the creator evidence and public confirmation, Option A is the clear winner'
    );
    expect(resolvedEvent!.evidenceUsed!.toString()).toBe(creatorEvidence._id.toString());
    expect(resolvedEvent!.curatorCommission).toBe(2.25);
  });

  it('should allow public to submit evidence when creator misses deadline', async () => {
    // Create event
    const now = new Date();
    const event = await eventService.createEvent({
      creator: creatorId,
      title: 'Event where creator misses deadline',
      description: 'Testing public evidence submission',
      category: 'Política',
      bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      expectedResolutionDate: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
      resultOptions: ['Yes', 'No'],
    });

    eventId = event._id.toString();

    // Simulate betting and evidence deadline both passed
    const eventDoc = await EventModel.findById(eventId);
    eventDoc!.bettingDeadline = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
    eventDoc!.evidenceDeadline = new Date(now.getTime() - 1 * 60 * 60 * 1000); // 1 hour ago
    await eventDoc!.save();

    // Creator tries to submit after deadline (should fail)
    await expect(
      evidenceService.createEvidence({
        eventId,
        submittedBy: creatorId,
        evidenceType: 'link',
        evidenceUrl: 'https://example.com/late',
        description: 'Creator trying after deadline',
        supportedOption: 'Yes',
      })
    ).rejects.toThrow('Event creator missed the deadline to submit evidence');

    // Public can submit
    const publicEvidence = await evidenceService.createEvidence({
      eventId,
      submittedBy: bettorId,
      evidenceType: 'link',
      evidenceUrl: 'https://example.com/public-proof',
      description: 'Public evidence since creator missed deadline',
      supportedOption: 'Yes',
    });

    expect(publicEvidence.submitterRole).toBe('public');
  });

  it('should calculate correct commission for different pool sizes', async () => {
    // Test with large pool
    const now = new Date();
    const event = await eventService.createEvent({
      creator: creatorId,
      title: 'Large pool event',
      description: 'Testing commission calculation',
      category: 'Economía',
      bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      expectedResolutionDate: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
      resultOptions: ['Up', 'Down'],
    });

    eventId = event._id.toString();

    // Place large bets
    await eventWagersService.placeEventWager(bettorId, eventId, 'Up', 500);

    // Simulate betting deadline passed
    const eventDoc = await EventModel.findById(eventId);
    eventDoc!.bettingDeadline = new Date(now.getTime() - 1000);
    eventDoc!.evidenceDeadline = new Date(now.getTime() - 1000);
    await eventDoc!.save();

    // Public submits evidence
    await evidenceService.createEvidence({
      eventId,
      submittedBy: creatorId,
      evidenceType: 'text',
      content: 'Market went up',
      description: 'Market evidence',
      supportedOption: 'Up',
    });

    // Curator resolves
    const settlement = await eventWagersService.settleEvent(eventId, 'Up', curatorId);

    // Verify commission
    expect(settlement.totalPool).toBe(500);
    expect(settlement.curatorCommission).toBe(500 * 0.005); // 2.5
    expect(settlement.distributionPool).toBe(500 * 0.995); // 497.5

    const curatorWallet = await WalletModel.findOne({ user: curatorId });
    expect(curatorWallet!.balanceAvailable).toBe(2.5);
  });

  it('should validate evidence supported option matches event result options', async () => {
    const now = new Date();
    const event = await eventService.createEvent({
      creator: creatorId,
      title: 'Validation test',
      description: 'Testing validation of evidence supported options',
      category: 'Otros',
      bettingDeadline: new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
      expectedResolutionDate: new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
      resultOptions: ['Red', 'Blue', 'Green'],
    });

    eventId = event._id.toString();

    // Simulate betting deadline passed to allow evidence submission
    const eventDoc = await EventModel.findById(eventId);
    eventDoc!.bettingDeadline = new Date(now.getTime() - 1000);
    await eventDoc!.save();

    // Try to submit evidence with invalid option
    await expect(
      evidenceService.createEvidence({
        eventId,
        submittedBy: creatorId,
        evidenceType: 'text',
        content: 'Invalid option',
        description: 'Testing invalid option',
        supportedOption: 'Yellow', // Not in result options
      })
    ).rejects.toThrow('Supported option must be one of: Red, Blue, Green');
  });
});
