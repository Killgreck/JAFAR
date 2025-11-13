import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { createWallet, getWalletByUser, updateWalletBalance, WalletConflictError } from './service';
import type { WalletDocument } from './model';

/**
 * Sanitizes a wallet document for client-side consumption.
 * @param wallet The wallet document to sanitize.
 * @returns A sanitized wallet object.
 */
function sanitizeWallet(wallet: WalletDocument) {
  return {
    id: wallet._id.toString(),
    user: wallet.user.toString(),
    balanceAvailable: wallet.balanceAvailable,
    balanceBlocked: wallet.balanceBlocked,
    lastUpdated: wallet.lastUpdated,
    balance: wallet.balance, // Keep for backwards compatibility
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
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
 * Controller for handling wallet-related requests.
 */
export class WalletController {
  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The wallet for the specified user.
   */
  async getByUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'userId must be a valid identifier' });
        return;
      }

      const wallet = await getWalletByUser(userId);
      if (!wallet) {
        res.status(404).json({ message: 'Wallet not found' });
        return;
      }
      res.json(sanitizeWallet(wallet));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The created wallet.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { user, balance } = req.body;
      if (!isValidObjectId(user)) {
        res.status(400).json({ message: 'user is required and must be a valid identifier' });
        return;
      }

      if (balance !== undefined && typeof balance !== 'number') {
        res.status(400).json({ message: 'balance must be a number when provided' });
        return;
      }

      const wallet = await createWallet({ user, balance });
      res.status(201).json(sanitizeWallet(wallet));
    } catch (error) {
      if (error instanceof WalletConflictError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      next(error);
    }
  }

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The updated wallet.
   */
  async updateBalance(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { balance } = req.body;

      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'userId must be a valid identifier' });
        return;
      }

      if (typeof balance !== 'number') {
        res.status(400).json({ message: 'balance must be a number' });
        return;
      }

      if (balance < 0) {
        res.status(400).json({ message: 'balance cannot be negative' });
        return;
      }

      const wallet = await updateWalletBalance(userId, balance);
      if (!wallet) {
        res.status(404).json({ message: 'Wallet not found' });
        return;
      }

      res.json(sanitizeWallet(wallet));
    } catch (error) {
      next(error);
    }
  }
}
