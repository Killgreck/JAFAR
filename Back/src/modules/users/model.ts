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
  },
  {
    timestamps: true,
  },
);

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
