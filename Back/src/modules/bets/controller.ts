import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createBet, getBetById, listBets, acceptBet } from './service';
import type { BetDocument } from './model';

/**
 * Sanitizes a bet document to a client-friendly format.
 * @param bet The bet document to sanitize.
 * @returns A sanitized bet object.
 */
function sanitizeBet(bet: BetDocument) {
  const opponent = bet.opponent ? bet.opponent.toString() : undefined;
  return {
    id: bet._id.toString(),
    creator: bet.creator.toString(),
    opponent,
    description: bet.description,
    amount: bet.amount,
    creatorSide: bet.creatorSide,
    status: bet.status,
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
   * @returns The created bet.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { creator, opponent, description, amount, creatorSide } = req.body;

      if (!isValidObjectId(creator) || !description || typeof amount !== 'number' || amount < 0) {
        res.status(400).json({ message: 'creator, description and a non-negative amount are required' });
        return;
      }

      if (creatorSide !== 'for' && creatorSide !== 'against') {
        res.status(400).json({ message: 'creatorSide must be either "for" or "against"' });
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
        creatorSide,
      });

      res.status(201).json(sanitizeBet(created));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The accepted bet.
   */
  async accept(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { opponentId } = req.body;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      if (!isValidObjectId(opponentId)) {
        res.status(400).json({ message: 'opponentId must be a valid identifier' });
        return;
      }

      const updated = await acceptBet(id, opponentId);
      res.json(sanitizeBet(updated));
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
        return;
      }
      next(error);
    }
  }
}
