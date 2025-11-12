import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createBet, getBetById, listBets } from './service';
import type { BetDocument } from './model';

/**
 * Sanitizes a bet document to a client-friendly format.
 * @param bet The bet document to sanitize.
 * @returns A sanitized bet object.
 */
function sanitizeBet(bet: BetDocument) {
  return {
    id: bet._id.toString(),
    creator: bet.creator.toString(),
    question: bet.question,
    totalForAmount: bet.totalForAmount,
    totalAgainstAmount: bet.totalAgainstAmount,
    status: bet.status,
    result: bet.result,
    settledAt: bet.settledAt,
    createdAt: bet.createdAt,
    updatedAt: bet.updatedAt,
  };
}

/**
 * Checks if a value is a valid Mongoose ObjectId.
 * @param value The value to check.
 * @returns True if the value is a valid ObjectId, false otherwise.
 */
function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Controller for handling bet-related requests.
 */
export class BetsController {
  /**
   * @param _req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns A list of all bets.
   */
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const bets = await listBets();
      res.json(bets.map(sanitizeBet));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The bet with the specified ID.
   */
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

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The created prediction.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { creator, question } = req.body;

      if (!isValidObjectId(creator) || !question || typeof question !== 'string') {
        res.status(400).json({ message: 'creator and question are required' });
        return;
      }

      const created = await createBet({
        creator,
        question,
      });

      res.status(201).json(sanitizeBet(created));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }
}
