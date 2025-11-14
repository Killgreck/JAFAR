import mongoose, { Types } from 'mongoose';

/**
 * Mongoose schema for event wagers.
 * Represents a user's bet on a specific outcome of an event.
 */
const eventWagerSchema = new mongoose.Schema(
  {
    /**
     * The event being wagered on.
     */
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: true,
    },
    /**
     * The user placing the wager.
     */
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * The selected outcome option.
     * Must match one of the event's resultOptions.
     */
    selectedOption: {
      type: String,
      required: true,
      trim: true,
    },
    /**
     * The amount wagered.
     */
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    /**
     * The odds at the time of placing the wager.
     * Calculated using parimutuel formula.
     */
    odds: {
      type: Number,
      required: true,
      min: 1.01,
    },
    /**
     * The potential payout if this option wins.
     * Calculated as: amount * odds
     */
    potentialPayout: {
      type: Number,
      required: true,
    },
    /**
     * Whether this wager won (set after event resolution).
     */
    won: {
      type: Boolean,
      required: false,
    },
    /**
     * The actual payout received (set after settlement).
     * For winners: recalculated final payout based on total pool
     * For losers: 0
     */
    actualPayout: {
      type: Number,
      default: 0,
    },
    /**
     * Whether the wager has been settled.
     */
    settled: {
      type: Boolean,
      default: false,
    },
    /**
     * When the wager was settled.
     */
    settledAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
eventWagerSchema.index({ event: 1, user: 1 });
eventWagerSchema.index({ user: 1, settled: 1 });
eventWagerSchema.index({ event: 1, selectedOption: 1 });
eventWagerSchema.index({ event: 1, settled: 1 });

/**
 * Represents an event wager in the database.
 */
export type EventWager = mongoose.InferSchemaType<typeof eventWagerSchema>;

/**
 * Represents a hydrated Mongoose document for an event wager.
 */
export type EventWagerDocument = mongoose.HydratedDocument<EventWager>;

/**
 * Mongoose model for the EventWager schema.
 * Use existing model if already compiled (for hot-reload support)
 */
export const EventWagerModel =
  mongoose.models.EventWager || mongoose.model('EventWager', eventWagerSchema);
