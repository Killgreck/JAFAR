import mongoose, { Types } from 'mongoose';

/**
 * Mongoose schema for the Wallet model.
 */
const walletSchema = new mongoose.Schema(
  {
    /**
     * The user who owns the wallet.
     */
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    /**
     * The available balance (funds that can be used for new bets or withdrawals).
     */
    balanceAvailable: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    /**
     * The blocked balance (funds locked in active bets).
     */
    balanceBlocked: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    /**
     * Timestamp of the last transaction/update to the wallet.
     */
    lastUpdated: {
      type: Date,
      required: true,
      default: Date.now,
    },
    /**
     * @deprecated Use balanceAvailable instead. Kept for backwards compatibility.
     * This field represents the total available balance.
     */
    balance: {
      type: Number,
      required: false,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Represents a wallet in the database.
 */
export type Wallet = mongoose.InferSchemaType<typeof walletSchema>;

/**
 * Represents a hydrated Mongoose document for a wallet.
 */
export type WalletDocument = mongoose.HydratedDocument<Wallet>;

/**
 * Mongoose model for the Wallet schema.
 */
export const WalletModel = mongoose.model('Wallet', walletSchema);
