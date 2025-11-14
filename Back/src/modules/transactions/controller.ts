import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  getUserTransactions,
  getTransactionById,
  getTransactionStats,
  TransactionFilters,
} from './service';
import { AuthenticatedRequest } from '../../middleware/auth';
import type { TransactionDocument } from './model';
import { TRANSACTION_TYPES, TransactionType } from './model';

/**
 * Sanitizes a transaction document for client-side consumption.
 *
 * @param transaction The transaction document to sanitize
 * @returns A sanitized transaction object
 */
function sanitizeTransaction(transaction: TransactionDocument) {
  const sanitized: any = {
    id: transaction._id.toString(),
    user: transaction.user.toString(),
    wallet: transaction.wallet.toString(),
    type: transaction.type,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    blockedBalanceAfter: transaction.blockedBalanceAfter,
    description: transaction.description,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };

  if (transaction.relatedEvent) {
    sanitized.relatedEvent = typeof transaction.relatedEvent === 'object'
      ? { id: (transaction.relatedEvent as any)._id.toString(), title: (transaction.relatedEvent as any).title }
      : transaction.relatedEvent.toString();
  }

  if (transaction.relatedWager) {
    sanitized.relatedWager = typeof transaction.relatedWager === 'object'
      ? { id: (transaction.relatedWager as any)._id.toString(), amount: (transaction.relatedWager as any).amount }
      : transaction.relatedWager.toString();
  }

  if (transaction.relatedBet) {
    sanitized.relatedBet = typeof transaction.relatedBet === 'object'
      ? { id: (transaction.relatedBet as any)._id.toString(), question: (transaction.relatedBet as any).question }
      : transaction.relatedBet.toString();
  }

  if (transaction.metadata) {
    sanitized.metadata = transaction.metadata;
  }

  return sanitized;
}

/**
 * Checks if a value is a valid Mongoose ObjectId.
 *
 * @param value The value to check
 * @returns True if the value is a valid ObjectId, false otherwise
 */
function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Controller for handling transaction-related requests.
 */
export class TransactionController {
  /**
   * Gets transactions for a user with filters and pagination.
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async getUserTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { type, dateFrom, dateTo, page, limit } = req.query;

      // Validate userId
      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      // Authorization check: users can only view their own transactions (unless admin)
      const authenticatedUserId = req.user?.userId;
      const userRole = req.user?.role;

      if (userId !== authenticatedUserId && userRole !== 'admin') {
        res.status(403).json({ message: 'You can only view your own transactions' });
        return;
      }

      // Validate type if provided
      if (type && typeof type === 'string' && !TRANSACTION_TYPES.includes(type as TransactionType)) {
        res.status(400).json({
          message: `Invalid transaction type. Must be one of: ${TRANSACTION_TYPES.join(', ')}`,
        });
        return;
      }

      // Parse dates if provided
      let dateFromParsed: Date | undefined;
      let dateToParsed: Date | undefined;

      if (dateFrom && typeof dateFrom === 'string') {
        dateFromParsed = new Date(dateFrom);
        if (isNaN(dateFromParsed.getTime())) {
          res.status(400).json({ message: 'Invalid dateFrom format' });
          return;
        }
      }

      if (dateTo && typeof dateTo === 'string') {
        dateToParsed = new Date(dateTo);
        if (isNaN(dateToParsed.getTime())) {
          res.status(400).json({ message: 'Invalid dateTo format' });
          return;
        }
      }

      // Parse pagination
      const pageNum = page ? parseInt(page as string, 10) : 1;
      const limitNum = limit ? parseInt(limit as string, 10) : 50;

      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ message: 'Invalid page number' });
        return;
      }

      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        res.status(400).json({ message: 'Invalid limit (must be between 1 and 100)' });
        return;
      }

      // Build filters
      const filters: TransactionFilters = {
        user: userId,
      };

      if (type) {
        filters.type = type as TransactionType;
      }

      if (dateFromParsed) {
        filters.dateFrom = dateFromParsed;
      }

      if (dateToParsed) {
        filters.dateTo = dateToParsed;
      }

      // Get transactions
      const result = await getUserTransactions(filters, pageNum, limitNum);

      res.json({
        transactions: result.transactions.map(sanitizeTransaction),
        pagination: {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasMore: result.hasMore,
          limit: limitNum,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets a single transaction by ID.
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'Invalid transaction ID' });
        return;
      }

      const transaction = await getTransactionById(id);

      if (!transaction) {
        res.status(404).json({ message: 'Transaction not found' });
        return;
      }

      // Authorization check
      const authenticatedUserId = req.user?.userId;
      const userRole = req.user?.role;

      if (transaction.user.toString() !== authenticatedUserId && userRole !== 'admin') {
        res.status(403).json({ message: 'You can only view your own transactions' });
        return;
      }

      res.json(sanitizeTransaction(transaction));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets transaction statistics for a user.
   *
   * @param req The authenticated request object
   * @param res The response object
   * @param next The next middleware function
   */
  async getStats(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;

      if (!isValidObjectId(userId)) {
        res.status(400).json({ message: 'Invalid user ID' });
        return;
      }

      // Authorization check
      const authenticatedUserId = req.user?.userId;
      const userRole = req.user?.role;

      if (userId !== authenticatedUserId && userRole !== 'admin') {
        res.status(403).json({ message: 'You can only view your own statistics' });
        return;
      }

      const stats = await getTransactionStats(userId);

      res.json(stats);
    } catch (error) {
      next(error);
    }
  }
}
