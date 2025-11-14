import mongoose, { Types } from 'mongoose';

/**
 * Valid evidence types.
 */
export const VALID_EVIDENCE_TYPES = [
  'link',
  'image',
  'document',
  'video',
  'text',
] as const;

export type EvidenceType = typeof VALID_EVIDENCE_TYPES[number];

/**
 * Role of the person submitting evidence.
 */
export const VALID_SUBMITTER_ROLES = [
  'creator',
  'public',
  'curator',
] as const;

export type SubmitterRole = typeof VALID_SUBMITTER_ROLES[number];

/**
 * Mongoose schema for the Evidence model.
 */
const evidenceSchema = new mongoose.Schema(
  {
    /**
     * The event this evidence belongs to.
     */
    event: {
      type: Types.ObjectId,
      ref: 'Event',
      required: true,
      index: true,
    },
    /**
     * The user who submitted the evidence.
     */
    submittedBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    /**
     * Role of the submitter (creator, public, curator).
     */
    submitterRole: {
      type: String,
      enum: {
        values: VALID_SUBMITTER_ROLES,
        message: 'Submitter role must be one of: ' + VALID_SUBMITTER_ROLES.join(', '),
      },
      required: true,
    },
    /**
     * Type of evidence (link, image, document, video, text).
     */
    evidenceType: {
      type: String,
      enum: {
        values: VALID_EVIDENCE_TYPES,
        message: 'Evidence type must be one of: ' + VALID_EVIDENCE_TYPES.join(', '),
      },
      required: true,
    },
    /**
     * URL to the evidence (for link, image, document, video types).
     */
    evidenceUrl: {
      type: String,
      required: false,
      trim: true,
    },
    /**
     * Text content (for text type evidence or additional description).
     */
    content: {
      type: String,
      required: false,
      trim: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    /**
     * Description of the evidence (10-500 characters).
     */
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    /**
     * The result option this evidence supports (must be one of the event's resultOptions).
     */
    supportedOption: {
      type: String,
      required: [true, 'Supported option is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Pre-save validation hook.
 */
evidenceSchema.pre('save', function(next) {
  // Ensure evidenceUrl or content is provided based on type
  if (this.evidenceType === 'text') {
    if (!this.content || this.content.trim().length === 0) {
      const error = new Error('Content is required for text type evidence');
      return next(error);
    }
  } else {
    if (!this.evidenceUrl || this.evidenceUrl.trim().length === 0) {
      const error = new Error('Evidence URL is required for non-text type evidence');
      return next(error);
    }
  }

  next();
});

/**
 * Index for faster queries by event and submitter.
 */
evidenceSchema.index({ event: 1, submittedBy: 1 });
evidenceSchema.index({ event: 1, submitterRole: 1 });

/**
 * Represents evidence in the database.
 */
export type Evidence = mongoose.InferSchemaType<typeof evidenceSchema>;

/**
 * Represents a hydrated Mongoose document for evidence.
 */
export type EvidenceDocument = mongoose.HydratedDocument<Evidence>;

/**
 * Mongoose model for the Evidence schema.
 */
export const EvidenceModel = mongoose.model('Evidence', evidenceSchema);
