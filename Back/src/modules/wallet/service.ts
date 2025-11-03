import { WalletModel, WalletDocument } from './model';

/**
 * Custom error class for wallet conflicts.
 */
export class WalletConflictError extends Error {
  status = 409;

  /**
   * @param message The error message.
   */
  constructor(message: string) {
    super(message);
    this.name = 'WalletConflictError';
  }
}

/**
 * Retrieves a wallet by user ID from the database.
 * @param userId The ID of the user whose wallet to retrieve.
 * @returns A promise that resolves to the wallet document or null if not found.
 */
export async function getWalletByUser(userId: string): Promise<WalletDocument | null> {
  return WalletModel.findOne({ user: userId }).exec();
}

/**
 * Creates a new wallet in the database.
 * @param data The data for the new wallet.
 * @returns A promise that resolves to the created wallet document.
 * @throws {WalletConflictError} If a wallet already exists for the user.
 */
export async function createWallet(data: {
  user: string;
  balance?: number;
}): Promise<WalletDocument> {
  const existing = await WalletModel.findOne({ user: data.user }).exec();
  if (existing) {
    throw new WalletConflictError('Wallet already exists for this user');
  }

  const created = await WalletModel.create({
    user: data.user,
    balance: data.balance ?? 0,
  });

  return created;
}

/**
 * Updates the balance of a wallet in the database.
 * @param userId The ID of the user whose wallet to update.
 * @param amount The new balance for the wallet.
 * @returns A promise that resolves to the updated wallet document or null if not found.
 */
export async function updateWalletBalance(userId: string, amount: number): Promise<WalletDocument | null> {
  const wallet = await WalletModel.findOneAndUpdate(
    { user: userId },
    { $set: { balance: amount } },
    { new: true },
  ).exec();

  return wallet;
}
