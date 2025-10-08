import { BetModel, BetDocument } from './model';

export async function listBets(): Promise<BetDocument[]> {
  return BetModel.find().exec();
}

export async function getBetById(id: string): Promise<BetDocument | null> {
  return BetModel.findById(id).exec();
}

export async function createBet(data: {
  creator: string;
  opponent?: string;
  description: string;
  amount: number;
}): Promise<BetDocument> {
  const created = await BetModel.create(data);
  return created;
}
