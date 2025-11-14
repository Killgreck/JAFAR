import mongoose, { Types } from 'mongoose';
import { EventWagerModel, EventWagerDocument } from './model';
import { EventModel } from '../events/model';
import { WalletModel } from '../wallet/model';

/**
 * Calculate parimutuel odds for a specific option.
 *
 * Formula:
 * odds = totalPool / optionPool
 *
 * @param totalPool Total amount wagered on all options
 * @param optionPool Amount wagered on this specific option
 * @returns Calculated odds (minimum 1.01)
 */
function calculateOdds(totalPool: number, optionPool: number): number {
  if (optionPool === 0) {
    // No bets on this option yet, return maximum odds
    return 10.0;
  }

  if (totalPool === 0) {
    // First bet on the event
    return 2.0;
  }

  const odds = totalPool / optionPool;
  return Math.max(odds, 1.01); // Minimum odds 1.01
}

/**
 * Get wagering statistics for an event.
 *
 * @param eventId Event ID
 * @returns Statistics by option and totals
 */
export async function getEventWagerStats(eventId: string): Promise<{
  totalWagers: number;
  totalAmount: number;
  byOption: Record<string, { wagers: number; amount: number; odds: number }>;
}> {
  const wagers = await EventWagerModel.find({ event: eventId }).exec();

  const stats: Record<string, { wagers: number; amount: number }> = {};
  let totalAmount = 0;

  for (const wager of wagers) {
    if (!stats[wager.selectedOption]) {
      stats[wager.selectedOption] = { wagers: 0, amount: 0 };
    }
    stats[wager.selectedOption].wagers += 1;
    stats[wager.selectedOption].amount += wager.amount;
    totalAmount += wager.amount;
  }

  // Calculate current odds for each option
  const byOption: Record<string, { wagers: number; amount: number; odds: number }> = {};
  for (const [option, data] of Object.entries(stats)) {
    byOption[option] = {
      ...data,
      odds: calculateOdds(totalAmount, data.amount),
    };
  }

  return {
    totalWagers: wagers.length,
    totalAmount,
    byOption,
  };
}

/**
 * Place a wager on an event.
 *
 * Process:
 * 1. Validate event exists and is open
 * 2. Validate betting deadline hasn't passed
 * 3. Validate selected option is valid
 * 4. Check user has sufficient balance
 * 5. Calculate current odds
 * 6. Deduct from wallet (balanceBlocked)
 * 7. Create wager
 *
 * @param userId User placing the wager
 * @param eventId Event to wager on
 * @param selectedOption Selected outcome
 * @param amount Wager amount
 * @returns Created wager
 */
export async function placeEventWager(
  userId: string,
  eventId: string,
  selectedOption: string,
  amount: number
): Promise<EventWagerDocument> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get and validate event
    const event = await EventModel.findById(eventId).session(session);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status !== 'open') {
      throw new Error(`Event is ${event.status}, betting is closed`);
    }

    // 2. Check betting deadline
    const now = new Date();
    if (event.bettingDeadline <= now) {
      throw new Error('Betting deadline has passed');
    }

    // 3. Validate selected option
    if (!event.resultOptions.includes(selectedOption)) {
      throw new Error(`Invalid option. Valid options: ${event.resultOptions.join(', ')}`);
    }

    // 4. Validate amount
    if (amount < 0.01) {
      throw new Error('Minimum wager amount is 0.01');
    }

    // 5. Check wallet balance
    const wallet = await WalletModel.findOne({ user: userId }).session(session);
    if (!wallet) {
      throw new Error('Wallet not found');
    }

    if (wallet.balanceAvailable < amount) {
      throw new Error(
        `Insufficient balance. Available: ${wallet.balanceAvailable}, Required: ${amount}`
      );
    }

    // 6. Get current stats and calculate odds
    const stats = await getEventWagerStats(eventId);
    const currentOptionAmount = stats.byOption[selectedOption]?.amount || 0;
    const newTotalAmount = stats.totalAmount + amount;
    const newOptionAmount = currentOptionAmount + amount;

    const odds = calculateOdds(newTotalAmount, newOptionAmount);
    const potentialPayout = amount * odds;

    // 7. Update wallet - move from available to blocked
    wallet.balanceAvailable -= amount;
    wallet.balanceBlocked += amount;
    wallet.lastUpdated = new Date();
    await wallet.save({ session });

    // 8. Create wager
    const wager = await EventWagerModel.create(
      [
        {
          event: new Types.ObjectId(eventId),
          user: new Types.ObjectId(userId),
          selectedOption,
          amount,
          odds,
          potentialPayout,
          settled: false,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    return wager[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

/**
 * Get all wagers for a specific event.
 *
 * @param eventId Event ID
 * @returns List of wagers
 */
export async function getEventWagers(eventId: string): Promise<EventWagerDocument[]> {
  return EventWagerModel.find({ event: eventId })
    .populate('user', 'username email')
    .sort({ createdAt: -1 })
    .exec();
}

/**
 * Get all wagers for a specific user.
 *
 * @param userId User ID
 * @param options Optional filters
 * @returns List of wagers
 */
export async function getUserEventWagers(
  userId: string,
  options?: { settled?: boolean }
): Promise<EventWagerDocument[]> {
  const query: any = { user: userId };

  if (options?.settled !== undefined) {
    query.settled = options.settled;
  }

  return EventWagerModel.find(query)
    .populate('event', 'title status winningOption resolvedAt')
    .sort({ createdAt: -1 })
    .exec();
}

/**
 * Get a specific wager by ID.
 *
 * @param wagerId Wager ID
 * @returns Wager or null
 */
export async function getEventWagerById(
  wagerId: string
): Promise<EventWagerDocument | null> {
  return EventWagerModel.findById(wagerId)
    .populate('event', 'title status winningOption resultOptions')
    .populate('user', 'username email')
    .exec();
}

/**
 * Resolve an event and settle all wagers.
 *
 * This function implements parimutuel distribution with curator commission:
 * 1. Validate evidence exists for the event
 * 2. Update event status to 'resolved'
 * 3. Get all wagers for the event
 * 4. Calculate total pool and curator commission (0.5%)
 * 5. Pay curator commission
 * 6. Distribute remaining pool (99.5%) to winners proportionally
 * 7. Update wallets (unblock funds, add winnings)
 * 8. Mark wagers as settled
 *
 * @param eventId Event ID to resolve
 * @param winningOption The winning outcome
 * @param curatorId ID of curator resolving the event
 * @param evidenceId ID of evidence used to make decision (optional)
 * @param rationale Curator's rationale for the decision
 * @returns Settlement summary
 */
export async function settleEvent(
  eventId: string,
  winningOption: string,
  curatorId: string,
  evidenceId?: string,
  rationale?: string
): Promise<{
  event: any;
  totalWagers: number;
  totalPool: number;
  curatorCommission: number;
  distributionPool: number;
  winnersCount: number;
  winnersPool: number;
  totalPayout: number;
}> {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Get and validate event
    const event = await EventModel.findById(eventId).session(session);
    if (!event) {
      throw new Error('Event not found');
    }

    if (event.status === 'resolved') {
      throw new Error('Event is already resolved');
    }

    if (event.status === 'cancelled') {
      throw new Error('Cannot resolve a cancelled event');
    }

    // Validate winning option
    if (!event.resultOptions.includes(winningOption)) {
      throw new Error(
        `Invalid winning option. Valid options: ${event.resultOptions.join(', ')}`
      );
    }

    // 2. Update event to resolved with curator info
    event.status = 'resolved';
    event.winningOption = winningOption;
    event.resolvedAt = new Date();
    event.resolvedBy = new Types.ObjectId(curatorId) as any;

    if (rationale) {
      event.resolutionRationale = rationale;
    }

    if (evidenceId) {
      event.evidenceUsed = new Types.ObjectId(evidenceId) as any;
    }

    await event.save({ session });

    // 3. Get all wagers for this event
    const wagers = await EventWagerModel.find({ event: eventId }).session(session);

    if (wagers.length === 0) {
      // No wagers to settle
      await session.commitTransaction();
      return {
        event,
        totalWagers: 0,
        totalPool: 0,
        curatorCommission: 0,
        distributionPool: 0,
        winnersCount: 0,
        winnersPool: 0,
        totalPayout: 0,
      };
    }

    // 4. Calculate pools
    let totalPool = 0;
    let winnersPool = 0;
    const winningWagers: EventWagerDocument[] = [];
    const losingWagers: EventWagerDocument[] = [];

    for (const wager of wagers) {
      totalPool += wager.amount;
      if (wager.selectedOption === winningOption) {
        winnersPool += wager.amount;
        winningWagers.push(wager);
      } else {
        losingWagers.push(wager);
      }
    }

    // 5. Calculate and pay curator commission (0.5% of total pool)
    const curatorCommission = totalPool * 0.005;
    const distributionPool = totalPool - curatorCommission;

    // Pay curator commission
    const curatorWallet = await WalletModel.findOne({ user: curatorId }).session(session);
    if (curatorWallet) {
      curatorWallet.balanceAvailable += curatorCommission;
      curatorWallet.lastUpdated = new Date();
      await curatorWallet.save({ session });
    }

    // Store curator commission in event
    event.curatorCommission = curatorCommission;
    await event.save({ session });

    // 6. Settle wagers
    let totalPayout = 0;

    if (winningWagers.length === 0) {
      // No winners - return all funds to bettors
      for (const wager of losingWagers) {
        const wallet = await WalletModel.findOne({ user: wager.user }).session(session);
        if (!wallet) continue;

        // Return blocked funds to available
        wallet.balanceBlocked -= wager.amount;
        wallet.balanceAvailable += wager.amount;
        wallet.lastUpdated = new Date();
        await wallet.save({ session });

        // Mark wager as settled (no winner)
        wager.settled = true;
        wager.won = false;
        wager.actualPayout = wager.amount; // Return original bet
        wager.settledAt = new Date();
        await wager.save({ session });

        totalPayout += wager.amount;
      }
    } else {
      // Parimutuel distribution: winners share the distribution pool (99.5% of total)
      for (const wager of winningWagers) {
        const wallet = await WalletModel.findOne({ user: wager.user }).session(session);
        if (!wallet) continue;

        // Calculate payout: (bet / winners pool) * distribution pool
        const payoutRatio = wager.amount / winnersPool;
        const payout = payoutRatio * distributionPool;

        // Update wallet
        wallet.balanceBlocked -= wager.amount;
        wallet.balanceAvailable += payout;
        wallet.lastUpdated = new Date();
        await wallet.save({ session });

        // Mark wager as settled (winner)
        wager.settled = true;
        wager.won = true;
        wager.actualPayout = payout;
        wager.settledAt = new Date();
        await wager.save({ session });

        totalPayout += payout;
      }

      // Losers: just unblock funds (no payout)
      for (const wager of losingWagers) {
        const wallet = await WalletModel.findOne({ user: wager.user }).session(session);
        if (!wallet) continue;

        // Unblock funds (they go to winners)
        wallet.balanceBlocked -= wager.amount;
        wallet.lastUpdated = new Date();
        await wallet.save({ session });

        // Mark wager as settled (loser)
        wager.settled = true;
        wager.won = false;
        wager.actualPayout = 0;
        wager.settledAt = new Date();
        await wager.save({ session });
      }
    }

    await session.commitTransaction();

    return {
      event,
      totalWagers: wagers.length,
      totalPool,
      curatorCommission,
      distributionPool,
      winnersCount: winningWagers.length,
      winnersPool,
      totalPayout,
    };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}
