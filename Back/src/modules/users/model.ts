import mongoose from 'mongoose';

/**
 * Mongoose schema for the User model.
 */
const userSchema = new mongoose.Schema(
  {
    /**
     * The user's email address.
     */
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
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
 */
export const UserModel = mongoose.model('User', userSchema);
