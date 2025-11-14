import mongoose, { Types } from 'mongoose';

/**
 * Valid types of wallet transactions.
 */
export const TRANSACTION_TYPES = [
  'deposit',      // User deposits funds
  'withdraw',     // User withdraws funds
  'block',        // Funds blocked for a bet
  'release',      // Blocked funds released (bet cancelled/refunded)
  'win',          // User wins a bet
  'loss',         // User loses a bet
  'commission',   // Curator commission deducted
] as const;

export type TransactionType = typeof TRANSACTION_TYPES[number];

/**
 * Mongoose schema for the Transaction model.
 */
const transactionSchema = new mongoose.Schema(
  {
    /**
     * The user who owns this transaction.
     */
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /**
     * The wallet this transaction belongs to.
     */
    wallet: {
      type: Types.ObjectId,
      ref: 'Wallet',
      required: true,
    },
    /**
     * Type of transaction.
     */
    type: {
      type: String,
      enum: {
        values: TRANSACTION_TYPES,
        message: 'Type must be one of: ' + TRANSACTION_TYPES.join(', '),
      },
      required: true,
    },
    /**
     * Amount of the transaction (positive or negative).
     * Positive for deposits, wins, releases.
     * Negative for withdrawals, losses, blocks, commissions.
     */
    amount: {
      type: Number,
      required: true,
    },
    /**
     * Balance after this transaction (balanceAvailable).
     */
    balanceAfter: {
      type: Number,
      required: true,
      min: 0,
    },
    /**
     * Blocked balance after this transaction.
     */
    blockedBalanceAfter: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
    /**
     * Description of the transaction.
     */
    description: {
      type: String,
      required: true,
      trim: true,
    },
    /**
     * Related event ID (for bet-related transactions).
     */
    relatedEvent: {
      type: Types.ObjectId,
      ref: 'Event',
      required: false,
    },
    /**
     * Related wager ID (for bet-related transactions).
     */
    relatedWager: {
      type: Types.ObjectId,
      ref: 'EventWager',
      required: false,
    },
    /**
     * Related bet ID (for prediction-related transactions).
     */
    relatedBet: {
      type: Types.ObjectId,
      ref: 'Bet',
      required: false,
    },
    /**
     * Additional metadata for the transaction.
     */
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Compound index for efficient queries by user and date.
 * This allows fast lookups for user transaction history sorted by date.
 */
transactionSchema.index({ user: 1, createdAt: -1 });

/**
 * Index for filtering by transaction type.
 */
transactionSchema.index({ type: 1 });

/**
 * Index for looking up transactions by related entities.
 */
transactionSchema.index({ relatedEvent: 1 });
transactionSchema.index({ relatedWager: 1 });
transactionSchema.index({ relatedBet: 1 });

/**
 * Represents a transaction in the database.
 */
export type Transaction = mongoose.InferSchemaType<typeof transactionSchema>;

/**
 * Represents a hydrated Mongoose document for a transaction.
 */
export type TransactionDocument = mongoose.HydratedDocument<Transaction>;

/**
 * Mongoose model for the Transaction schema.
 */
export const TransactionModel = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
