import mongoose, { Types } from 'mongoose';

/**
 * Mongoose schema for the Bet model (Prediction Market).
 */
const betSchema = new mongoose.Schema(
  {
    /**
     * The user who created the prediction question.
     */
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * The prediction question.
     */
    question: {
      type: String,
      required: true,
      trim: true,
    },
    /**
     * Total amount wagered on "for" side.
     */
    totalForAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * Total amount wagered on "against" side.
     */
    totalAgainstAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    /**
     * The status of the bet.
     */
    status: {
      type: String,
      enum: ['open', 'settled', 'cancelled'],
      default: 'open',
    },
    /**
     * The result of the bet (when settled).
     */
    result: {
      type: String,
      enum: ['for', 'against'],
      required: false,
    },
    /**
     * When the bet was settled.
     */
    settledAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Represents a bet in the database.
 */
export type Bet = mongoose.InferSchemaType<typeof betSchema>;

/**
 * Represents a hydrated Mongoose document for a bet.
 */
export type BetDocument = mongoose.HydratedDocument<Bet>;

/**
 * Mongoose model for the Bet schema.
 */
export const BetModel = mongoose.model('Bet', betSchema);
