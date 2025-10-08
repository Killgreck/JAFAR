import { WalletModel, WalletDocument } from './model';

export class WalletConflictError extends Error {
  status = 409;

  constructor(message: string) {
    super(message);
    this.name = 'WalletConflictError';
  }
}

export async function getWalletByUser(userId: string): Promise<WalletDocument | null> {
  return WalletModel.findOne({ user: userId }).exec();
}

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

export async function updateWalletBalance(userId: string, amount: number): Promise<WalletDocument | null> {
  const wallet = await WalletModel.findOneAndUpdate(
    { user: userId },
    { $set: { balance: amount } },
    { new: true },
  ).exec();

  return wallet;
}
