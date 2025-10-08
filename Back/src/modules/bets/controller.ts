import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createBet, getBetById, listBets } from './service';
import type { BetDocument } from './model';

function sanitizeBet(bet: BetDocument) {
  const opponent = bet.opponent ? bet.opponent.toString() : undefined;
  return {
    id: bet._id.toString(),
    creator: bet.creator.toString(),
    opponent,
    description: bet.description,
    amount: bet.amount,
    status: bet.status,
    createdAt: bet.createdAt,
    updatedAt: bet.updatedAt,
  };
}

function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

export class BetsController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const bets = await listBets();
      res.json(bets.map(sanitizeBet));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      const bet = await getBetById(id);
      if (!bet) {
        res.status(404).json({ message: 'Bet not found' });
        return;
      }
      res.json(sanitizeBet(bet));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { creator, opponent, description, amount } = req.body;

      if (!isValidObjectId(creator) || !description || typeof amount !== 'number' || amount < 0) {
        res.status(400).json({ message: 'creator, description and a non-negative amount are required' });
        return;
      }

      if (opponent !== undefined && opponent !== null && !isValidObjectId(opponent)) {
        res.status(400).json({ message: 'opponent must be a valid user id when provided' });
        return;
      }

      const created = await createBet({
        creator,
        opponent,
        description,
        amount,
      });

      res.status(201).json(sanitizeBet(created));
    } catch (error) {
      next(error);
    }
  }
}
