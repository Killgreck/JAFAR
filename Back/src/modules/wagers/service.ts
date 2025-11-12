import { WagerModel, WagerDocument } from './model';
import { BetModel } from '../bets/model';
import { UserModel } from '../users/model';

/**
 * Calculate current odds for a side based on total pool
 * Odds represent potential multiplier (e.g., 2.5x means $10 bet wins $25)
 */
export function calculateOdds(totalForAmount: number, totalAgainstAmount: number, side: 'for' | 'against'): number {
  const totalPool = totalForAmount + totalAgainstAmount;

  if (totalPool === 0) {
    // Initial odds when no bets placed yet
    return 2.0;
  }

  const sideAmount = side === 'for' ? totalForAmount : totalAgainstAmount;

  if (sideAmount === 0) {
    // If no bets on this side, odds are very high
    return 10.0;
  }

  // Odds = total pool / amount on this side
  // This represents how much total you get back per dollar wagered
  const odds = totalPool / sideAmount;

  // Minimum odds of 1.01 (1% profit)
  return Math.max(odds, 1.01);
}

/**
 * Place a wager on a prediction
 */
export async function placeWager(data: {
  betId: string;
  userId: string;
  side: 'for' | 'against';
  amount: number;
}): Promise<WagerDocument> {
  const { betId, userId, side, amount } = data;

  // Validate bet exists and is open
  const bet = await BetModel.findById(betId);
  if (!bet) {
    throw new Error('Prediction not found');
  }

  if (bet.status !== 'open') {
    throw new Error('Prediction is not open for wagering');
  }

  // Validate user has sufficient balance
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const currentBalance = user.balance ?? 0;
  if (currentBalance < amount) {
    throw new Error('Insufficient balance');
  }

  // Calculate current odds before placing wager
  const odds = calculateOdds(bet.totalForAmount, bet.totalAgainstAmount, side);

  // Deduct balance from user
  user.balance = currentBalance - amount;
  await user.save();

  // Update bet totals
  if (side === 'for') {
    bet.totalForAmount += amount;
  } else {
    bet.totalAgainstAmount += amount;
  }
  await bet.save();

  // Create wager record
  const wager = await WagerModel.create({
    bet: betId,
    user: userId,
    side,
    amount,
    odds,
  });

  return wager;
}

/**
 * Get all wagers for a specific bet
 */
export async function getWagersByBet(betId: string): Promise<WagerDocument[]> {
  return WagerModel.find({ bet: betId }).sort({ createdAt: -1 });
}

/**
 * Get all wagers for a specific user
 */
export async function getWagersByUser(userId: string): Promise<WagerDocument[]> {
  return WagerModel.find({ user: userId }).sort({ createdAt: -1 });
}
