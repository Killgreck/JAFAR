import mongoose, { Types } from 'mongoose';

/**
 * Mongoose schema for the User model.
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * The user's email address.
     * Validated with regex to ensure proper email format.
     */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          // RFC 5322 simplified regex for email validation
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid email address`
      }
    },
    /**
     * The user's username.
     */
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    /**
     * The user's hashed password.
     */
    passwordHash: {
      type: String,
      required: true,
    },
    /**
     * The user's balance.
     */
    balance: {
      type: Number,
      default: 25,
      min: 0,
    },
    /**
     * The user's role in the system.
     * - user: Regular user, can place bets and create events
     * - curator: Can curate/resolve events after betting deadline
     * - admin: Full system access, can approve curators
     */
    role: {
      type: String,
      enum: ['user', 'curator', 'admin'],
      default: 'user',
      required: true,
    },
    /**
     * Curator approval status.
     * - none: Not a curator, no application
     * - pending: Curator application submitted, awaiting review
     * - approved: Curator application approved
     * - rejected: Curator application rejected
     */
    curatorStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
      required: true,
    },
    /**
     * Timestamp when the user was approved as curator.
     */
    curatorApprovedAt: {
      type: Date,
      required: false,
    },
    /**
     * Admin who approved this user as curator.
     */
    curatorApprovedBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    /**
     * Whether the user is currently banned from the platform.
     */
    isBanned: {
      type: Boolean,
      default: false,
      required: true,
    },
    /**
     * Timestamp when the user was banned.
     */
    bannedAt: {
      type: Date,
      required: false,
    },
    /**
     * Admin who banned this user.
     */
    bannedBy: {
      type: Types.ObjectId,
      ref: 'User',
      required: false,
    },
    /**
     * Reason for banning the user.
     */
    banReason: {
      type: String,
      required: false,
    },
    /**
     * Number of failed login attempts since last successful login.
     * Used for rate limiting to prevent brute force attacks.
     */
    loginAttempts: {
      type: Number,
      default: 0,
      min: 0,
      required: true,
    },
    /**
     * Timestamp until which the account is locked due to failed login attempts.
     * Account will be locked for 15 minutes after 5 failed attempts.
     */
    lockUntil: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
  },
);

/**
 * Post-save hook to automatically create a wallet for new users.
 * This ensures that every user has a wallet with zero balance upon registration.
 * Note: We check if a wallet already exists to handle cases where the hook runs multiple times.
 */
userSchema.post('save', async function(doc) {
  try {
    // Dynamically import WalletModel to avoid circular dependency issues
    const { WalletModel } = await import('../wallet/model');

    // Check if wallet already exists (safety check)
    const existingWallet = await WalletModel.findOne({ user: doc._id }).exec();
    if (!existingWallet) {
      await WalletModel.create({
        user: doc._id,
        balanceAvailable: 0,
        balanceBlocked: 0,
        lastUpdated: new Date(),
        balance: 0, // Keep for backwards compatibility
      });
    }
  } catch (error) {
    // Log error but don't fail user creation
    console.error('Failed to create wallet for user:', doc._id, error);
  }
});

/**
 * Represents a user in the database.
 */
export type User = mongoose.InferSchemaType<typeof userSchema>;

/**
 * Represents a hydrated Mongoose document for a user.
 */
export type UserDocument = mongoose.HydratedDocument<User>;

/**
 * Mongoose model for the User schema.
 * Use existing model if already compiled (for hot-reload support)
 */
export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
