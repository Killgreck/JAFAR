import mongoose, { Types } from 'mongoose';

const betSchema = new mongoose.Schema(
  {
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    opponent: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['open', 'accepted', 'settled', 'cancelled'],
      default: 'open',
    },
  },
  {
    timestamps: true,
  },
);

export type Bet = mongoose.InferSchemaType<typeof betSchema>;
export type BetDocument = mongoose.HydratedDocument<Bet>;

export const BetModel = mongoose.model('Bet', betSchema);
