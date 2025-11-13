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
  balanceAvailable?: number;
  balanceBlocked?: number;
}): Promise<WalletDocument> {
  const existing = await WalletModel.findOne({ user: data.user }).exec();
  if (existing) {
    throw new WalletConflictError('Wallet already exists for this user');
  }

  // Support both old 'balance' field and new 'balanceAvailable' field for backwards compatibility
  const availableBalance = data.balanceAvailable ?? data.balance ?? 0;

  const created = await WalletModel.create({
    user: data.user,
    balanceAvailable: availableBalance,
    balanceBlocked: data.balanceBlocked ?? 0,
    lastUpdated: new Date(),
    balance: availableBalance, // Keep for backwards compatibility
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
    {
      $set: {
        balanceAvailable: amount,
        balance: amount, // Keep for backwards compatibility
        lastUpdated: new Date(),
      }
    },
    { new: true },
  ).exec();

  return wallet;
}
