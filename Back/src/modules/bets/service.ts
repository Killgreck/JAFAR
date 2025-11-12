import { BetModel, BetDocument } from './model';
import { UserModel } from '../users/model';

/**
 * Retrieves a list of all bets from the database.
 * @returns A promise that resolves to an array of bet documents.
 */
export async function listBets(): Promise<BetDocument[]> {
  return BetModel.find().exec();
}

/**
 * Retrieves a bet by its ID from the database.
 * @param id The ID of the bet to retrieve.
 * @returns A promise that resolves to the bet document or null if not found.
 */
export async function getBetById(id: string): Promise<BetDocument | null> {
  return BetModel.findById(id).exec();
}

/**
 * Creates a new bet in the database and deducts the amount from the creator's balance.
 * @param data The data for the new bet.
 * @returns A promise that resolves to the created bet document.
 * @throws {Error} If the user doesn't have sufficient balance.
 */
export async function createBet(data: {
  creator: string;
  opponent?: string;
  description: string;
  amount: number;
}): Promise<BetDocument> {
  // Get the creator
  const creator = await UserModel.findById(data.creator);
  if (!creator) {
    throw new Error('Creator not found');
  }

  // Check if creator has sufficient balance
  const currentBalance = creator.balance ?? 0;
  if (currentBalance < data.amount) {
    throw new Error('Insufficient balance');
  }

  // Deduct the amount from the creator's balance
  creator.balance = currentBalance - data.amount;
  await creator.save();

  // Create the bet
  const created = await BetModel.create(data);
  return created;
}
