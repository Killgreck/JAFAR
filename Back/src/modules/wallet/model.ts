import mongoose, { Types } from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
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

export type Wallet = mongoose.InferSchemaType<typeof walletSchema>;
export type WalletDocument = mongoose.HydratedDocument<Wallet>;

export const WalletModel = mongoose.model('Wallet', walletSchema);
