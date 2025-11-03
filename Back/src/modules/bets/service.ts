import { BetModel, BetDocument } from './model';

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
 * Creates a new bet in the database.
 * @param data The data for the new bet.
 * @returns A promise that resolves to the created bet document.
 */
export async function createBet(data: {
  creator: string;
  opponent?: string;
  description: string;
  amount: number;
}): Promise<BetDocument> {
  const created = await BetModel.create(data);
  return created;
}
