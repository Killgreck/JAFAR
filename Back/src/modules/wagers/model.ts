import { Schema, model, Document, Types } from 'mongoose';

export interface WagerDocument extends Document {
  bet: Types.ObjectId;
  user: Types.ObjectId;
  side: 'for' | 'against';
  amount: number;
  odds: number;
  createdAt: Date;
  payout?: number;
}

const wagerSchema = new Schema<WagerDocument>(
  {
    bet: {
      type: Schema.Types.ObjectId,
      ref: 'Bet',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    side: {
      type: String,
      enum: ['for', 'against'],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    odds: {
      type: Number,
      required: true,
      min: 0,
    },
    payout: {
      type: Number,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

export const WagerModel = model<WagerDocument>('Wager', wagerSchema);
