import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { placeWager, getWagersByBet, getWagersByUser } from './service';
import type { WagerDocument } from './model';

/**
 * Sanitizes a wager document to a client-friendly format.
 */
function sanitizeWager(wager: WagerDocument) {
  return {
    id: wager._id.toString(),
    bet: wager.bet.toString(),
    user: wager.user.toString(),
    side: wager.side,
    amount: wager.amount,
    odds: wager.odds,
    payout: wager.payout,
    createdAt: wager.createdAt,
  };
}

/**
 * Checks if a value is a valid Mongoose ObjectId.
 */
function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Controller for handling wager-related requests.
 */
export class WagersController {
  /**
   * Place a wager on a prediction.
   */
  async placeWager(req: Request, res: Response, next: NextFunction) {
    try {
      const { betId, userId, side, amount } = req.body;

      if (!isValidObjectId(betId)) {
        res.status(400).json({ message: 'betId must be a valid identifier' });
        return;
      }

      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'userId must be a valid identifier' });
        return;
      }

      if (side !== 'for' && side !== 'against') {
        res.status(400).json({ message: 'side must be either "for" or "against"' });
        return;
      }

      if (typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({ message: 'amount must be a positive number' });
        return;
      }

      const wager = await placeWager({ betId, userId, side, amount });
      res.status(201).json(sanitizeWager(wager));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * Get all wagers for a specific bet.
   */
  async getByBet(req: Request, res: Response, next: NextFunction) {
    try {
      const { betId } = req.params;

      if (!isValidObjectId(betId)) {
        res.status(400).json({ message: 'betId must be a valid identifier' });
        return;
      }

      const wagers = await getWagersByBet(betId);
      res.json(wagers.map(sanitizeWager));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all wagers for a specific user.
   */
  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'userId must be a valid identifier' });
        return;
      }

      const wagers = await getWagersByUser(userId);
      res.json(wagers.map(sanitizeWager));
    } catch (error) {
      next(error);
    }
  }
}
