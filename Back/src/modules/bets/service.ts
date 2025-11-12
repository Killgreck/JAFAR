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
 * Creates a new prediction question (no wager placed at creation).
 * @param data The data for the new prediction.
 * @returns A promise that resolves to the created bet document.
 */
export async function createBet(data: {
  creator: string;
  question: string;
}): Promise<BetDocument> {
  // Validate creator exists
  const creator = await UserModel.findById(data.creator);
  if (!creator) {
    throw new Error('Creator not found');
  }

  // Create the prediction
  const created = await BetModel.create({
    creator: data.creator,
    question: data.question,
    totalForAmount: 0,
    totalAgainstAmount: 0,
    status: 'open',
  });

  return created;
}
