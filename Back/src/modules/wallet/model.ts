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
     * The balance of the wallet.
     */
    balance: {
      type: Number,
      required: true,
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
