import mongoose, { Types } from 'mongoose';

/**
 * Valid categories for betting events.
 */
export const VALID_CATEGORIES = [
  'Deportes',
  'Política',
  'Entretenimiento',
  'Economía',
  'Otros',
] as const;

export type EventCategory = typeof VALID_CATEGORIES[number];

/**
 * Valid statuses for events.
 */
export const VALID_STATUSES = [
  'open',
  'closed',
  'resolved',
  'cancelled',
] as const;

export type EventStatus = typeof VALID_STATUSES[number];

/**
 * Valid evidence submission phases.
 */
export const VALID_EVIDENCE_PHASES = [
  'none',
  'creator',
  'public',
] as const;

export type EvidencePhase = typeof VALID_EVIDENCE_PHASES[number];

/**
 * Mongoose schema for the Event model.
 */
const eventSchema = new mongoose.Schema(
  {
    /**
     * The user who created the event.
     */
    creator: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * Event title (10-200 characters).
     */
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    /**
     * Event description (20-1000 characters).
     */
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    /**
     * Event category.
     */
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: VALID_CATEGORIES,
        message: 'Category must be one of: ' + VALID_CATEGORIES.join(', '),
      },
    },
    /**
     * Deadline for placing bets (must be at least 1 hour from creation).
     */
    bettingDeadline: {
      type: Date,
      required: [true, 'Betting deadline is required'],
    },
    /**
     * Deadline for creator to submit evidence (bettingDeadline + 24 hours).
     * After this deadline, public can submit evidence.
     */
    evidenceDeadline: {
      type: Date,
      required: false,
    },
    /**
     * Current phase of evidence submission (none/creator/public).
     */
    evidenceSubmissionPhase: {
      type: String,
      enum: {
        values: VALID_EVIDENCE_PHASES,
        message: 'Evidence phase must be one of: ' + VALID_EVIDENCE_PHASES.join(', '),
      },
      default: 'none',
    },
    /**
     * Expected date when the event will be resolved.
     */
    expectedResolutionDate: {
      type: Date,
      required: [true, 'Expected resolution date is required'],
    },
    /**
     * Possible result options for the event (2-10 options).
     */
    resultOptions: {
      type: [String],
      required: [true, 'Result options are required'],
      validate: {
        validator: function(options: string[]) {
          return options && options.length >= 2 && options.length <= 10;
        },
        message: 'Result options must contain between 2 and 10 options',
      },
    },
    /**
     * Current status of the event.
     */
    status: {
      type: String,
      enum: {
        values: VALID_STATUSES,
        message: 'Status must be one of: ' + VALID_STATUSES.join(', '),
      },
      default: 'open',
    },
    /**
     * The winning option (set when event is resolved).
     */
    winningOption: {
      type: String,
      required: false,
    },
    /**
     * Timestamp when the event was resolved.
     */
    resolvedAt: {
      type: Date,
      required: false,
    },
    /**
     * The curator who resolved the event.
     */
    resolvedBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    /**
     * Curator's rationale/reason for the decision.
     */
    resolutionRationale: {
      type: String,
      required: false,
      trim: true,
      maxlength: [1000, 'Resolution rationale cannot exceed 1000 characters'],
    },
    /**
     * The evidence used by curator to make the decision.
     */
    evidenceUsed: {
      type: Types.ObjectId,
      ref: 'Evidence',
      required: false,
    },
    /**
     * Curator commission paid from this event (0.5% of total pool).
     */
    curatorCommission: {
      type: Number,
      required: false,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Pre-save validation hook to ensure date logic is correct.
 */
eventSchema.pre('save', function(next) {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);

  // Validate betting deadline is at least 1 hour from now (only for new documents)
  if (this.isNew && this.bettingDeadline < oneHourFromNow) {
    const error = new Error('Betting deadline must be at least 1 hour from now');
    return next(error);
  }

  // Auto-calculate evidence deadline (betting deadline + 24 hours)
  if (this.isNew || this.isModified('bettingDeadline')) {
    const oneDayInMs = 24 * 60 * 60 * 1000;
    this.evidenceDeadline = new Date(this.bettingDeadline.getTime() + oneDayInMs);
  }

  // Validate expected resolution date is after betting deadline
  if (this.expectedResolutionDate <= this.bettingDeadline) {
    const error = new Error('Expected resolution date must be after betting deadline');
    return next(error);
  }

  // Validate winningOption is one of the resultOptions (if set)
  if (this.winningOption && !this.resultOptions.includes(this.winningOption)) {
    const error = new Error('Winning option must be one of the result options');
    return next(error);
  }

  next();
});

/**
 * Index for faster queries by creator, category, and status.
 */
eventSchema.index({ creator: 1 });
eventSchema.index({ category: 1 });
eventSchema.index({ status: 1 });
eventSchema.index({ bettingDeadline: 1 });

/**
 * Represents an event in the database.
 */
export type Event = mongoose.InferSchemaType<typeof eventSchema>;

/**
 * Represents a hydrated Mongoose document for an event.
 */
export type EventDocument = mongoose.HydratedDocument<Event>;

/**
 * Mongoose model for the Event schema.
 */
export const EventModel = mongoose.model('Event', eventSchema);
