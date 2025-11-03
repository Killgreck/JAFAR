import mongoose, { Types } from 'mongoose';

/**
 * Mongoose schema for the Bet model.
 */
const betSchema = new mongoose.Schema(
  {
    /**
     * The user who created the bet.
     */
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * The user who is the opponent in the bet.
     */
    opponent: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    /**
     * The description of the bet.
     */
    description: {
      type: String,
      required: true,
      trim: true,
    },
    /**
     * The amount of the bet.
     */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    /**
     * The status of the bet.
     */
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
