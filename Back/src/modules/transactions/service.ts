import { TransactionModel, TransactionDocument, TransactionType } from './model';

/**
 * Interface for creating a new transaction.
 */
export interface CreateTransactionData {
  user: string;
  wallet: string;
  type: TransactionType;
  amount: number;
  balanceAfter: number;
  blockedBalanceAfter?: number;
  description: string;
  relatedEvent?: string;
  relatedWager?: string;
  relatedBet?: string;
  metadata?: any;
}

/**
 * Interface for transaction filters.
 */
export interface TransactionFilters {
  user: string;
  type?: TransactionType;
  dateFrom?: Date;
  dateTo?: Date;
}

/**
 * Interface for transaction list with pagination.
 */
export interface TransactionListResult {
  transactions: TransactionDocument[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

/**
 * Creates a new transaction record.
 *
 * @param data The transaction data
 * @returns A promise that resolves to the created transaction document
 */
export async function createTransaction(data: CreateTransactionData): Promise<TransactionDocument> {
  const transaction = await TransactionModel.create({
    user: data.user,
    wallet: data.wallet,
    type: data.type,
    amount: data.amount,
    balanceAfter: data.balanceAfter,
    blockedBalanceAfter: data.blockedBalanceAfter ?? 0,
    description: data.description,
    relatedEvent: data.relatedEvent,
    relatedWager: data.relatedWager,
    relatedBet: data.relatedBet,
    metadata: data.metadata,
  });

  return transaction;
}

/**
 * Retrieves transactions for a user with filters and pagination.
 *
 * @param filters Filter options (user required, type optional)
 * @param page Page number (default: 1)
 * @param limit Results per page (default: 50, max: 100)
 * @returns A promise that resolves to the transaction list with pagination info
 */
export async function getUserTransactions(
  filters: TransactionFilters,
  page: number = 1,
  limit: number = 50,
): Promise<TransactionListResult> {
  // Build query
  const query: any = {
    user: filters.user,
  };

  // Filter by type if specified
  if (filters.type) {
    query.type = filters.type;
  }

  // Filter by date range if specified
  if (filters.dateFrom || filters.dateTo) {
    query.createdAt = {};
    if (filters.dateFrom) {
      query.createdAt.$gte = filters.dateFrom;
    }
    if (filters.dateTo) {
      query.createdAt.$lte = filters.dateTo;
    }
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Execute query with pagination
  const [transactions, total] = await Promise.all([
    TransactionModel.find(query)
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate('relatedEvent', 'title')
      .populate('relatedWager', 'amount')
      .populate('relatedBet', 'question')
      .exec(),
    TransactionModel.countDocuments(query).exec(),
  ]);

  const totalPages = Math.ceil(total / limit);
  const hasMore = page < totalPages;

  return {
    transactions,
    total,
    page,
    totalPages,
    hasMore,
  };
}

/**
 * Retrieves a single transaction by ID.
 *
 * @param id The transaction ID
 * @returns A promise that resolves to the transaction document or null if not found
 */
export async function getTransactionById(id: string): Promise<TransactionDocument | null> {
  return TransactionModel.findById(id)
    .populate('user', 'username email')
    .populate('relatedEvent', 'title')
    .populate('relatedWager', 'amount')
    .populate('relatedBet', 'question')
    .exec();
}

/**
 * Gets transaction statistics for a user.
 *
 * @param userId The user ID
 * @returns A promise that resolves to transaction statistics
 */
export async function getTransactionStats(userId: string): Promise<{
  totalDeposits: number;
  totalWithdrawals: number;
  totalWins: number;
  totalLosses: number;
  totalCommissions: number;
  transactionCount: number;
}> {
  const stats = await TransactionModel.aggregate([
    { $match: { user: userId } },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]).exec();

  const result = {
    totalDeposits: 0,
    totalWithdrawals: 0,
    totalWins: 0,
    totalLosses: 0,
    totalCommissions: 0,
    transactionCount: 0,
  };

  stats.forEach((stat: any) => {
    result.transactionCount += stat.count;

    switch (stat._id) {
      case 'deposit':
        result.totalDeposits = Math.abs(stat.total);
        break;
      case 'withdraw':
        result.totalWithdrawals = Math.abs(stat.total);
        break;
      case 'win':
        result.totalWins = Math.abs(stat.total);
        break;
      case 'loss':
        result.totalLosses = Math.abs(stat.total);
        break;
      case 'commission':
        result.totalCommissions = Math.abs(stat.total);
        break;
    }
  });

  return result;
}
