import mongoose, { Types } from 'mongoose';

/**
 * Mongoose schema for curator application requests.
 * Tracks user applications to become curators, which must be reviewed by admins.
 */
const curatorRequestSchema = new mongoose.Schema(
  {
    /**
     * The user who is requesting curator status.
     * Each user can only have one active request at a time.
     */
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    /**
     * Why the user wants to become a curator.
     * Minimum 50 characters to ensure thoughtful applications.
     */
    reason: {
      type: String,
      required: true,
      minlength: 50,
      maxlength: 500,
      trim: true,
    },
    /**
     * The user's relevant experience for being a curator.
     * Minimum 20 characters.
     */
    experience: {
      type: String,
      required: true,
      minlength: 20,
      maxlength: 1000,
      trim: true,
    },
    /**
     * Current status of the request.
     * - pending: Awaiting admin review
     * - approved: Admin approved, user promoted to curator
     * - rejected: Admin rejected the request
     */
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
    },
    /**
     * Admin who reviewed the request.
     */
    reviewedBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    /**
     * When the request was reviewed.
     */
    reviewedAt: {
      type: Date,
      required: false,
    },
    /**
     * Admin's notes on the decision.
     */
    reviewNotes: {
      type: String,
      maxlength: 500,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
curatorRequestSchema.index({ status: 1, createdAt: -1 });
curatorRequestSchema.index({ user: 1 });

/**
 * Represents a curator request in the database.
 */
export type CuratorRequest = mongoose.InferSchemaType<typeof curatorRequestSchema>;

/**
 * Represents a hydrated Mongoose document for a curator request.
 */
export type CuratorRequestDocument = mongoose.HydratedDocument<CuratorRequest>;

/**
 * Mongoose model for the CuratorRequest schema.
 * Use existing model if already compiled (for hot-reload support)
 */
export const CuratorRequestModel =
  mongoose.models.CuratorRequest || mongoose.model('CuratorRequest', curatorRequestSchema);
