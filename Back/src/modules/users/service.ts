import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, UserDocument } from './model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Rate limiting configuration
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutes in milliseconds

/**
 * Checks if a user account is currently locked due to failed login attempts.
 * @param user The user document to check.
 * @returns Object with isLocked boolean and optional minutesRemaining.
 */
function checkAccountLock(user: UserDocument): {
  isLocked: boolean;
  minutesRemaining?: number
} {
  if (!user.lockUntil || user.lockUntil <= new Date()) {
    return { isLocked: false };
  }

  const minutesRemaining = Math.ceil(
    (user.lockUntil.getTime() - Date.now()) / 60000
  );

  return {
    isLocked: true,
    minutesRemaining
  };
}

/**
 * Increments failed login attempts and locks account if threshold reached.
 * @param user The user document to update.
 * @returns Updated user document.
 */
async function handleFailedLogin(user: UserDocument): Promise<UserDocument> {
  user.loginAttempts += 1;

  if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
    user.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
    user.loginAttempts = 0; // Reset after lock
  }

  await user.save();
  return user;
}

/**
 * Resets failed login attempts on successful login.
 * @param user The user document to update.
 */
async function resetLoginAttempts(user: UserDocument): Promise<void> {
  if (user.loginAttempts > 0 || user.lockUntil) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }
}

/**
 * Retrieves a list of all users from the database.
 * @returns A promise that resolves to an array of user documents.
 */
export async function listUsers(): Promise<UserDocument[]> {
  return UserModel.find().exec();
}

/**
 * Retrieves a user by their ID from the database.
 * @param id The ID of the user to retrieve.
 * @returns A promise that resolves to the user document or null if not found.
 */
export async function getUserById(id: string): Promise<UserDocument | null> {
  return UserModel.findById(id).exec();
}

/**
 * Retrieves a user by their email from the database.
 * @param email The email of the user to retrieve.
 * @returns A promise that resolves to the user document or null if not found.
 */
export async function getUserByEmail(email: string): Promise<UserDocument | null> {
  return UserModel.findOne({ email: email.toLowerCase() }).exec();
}

/**
 * Creates a new user in the database.
 * @param data The data for the new user.
 * @returns A promise that resolves to the created user document.
 */
export async function createUser(data: {
  email: string;
  username: string;
  passwordHash: string;
}): Promise<UserDocument> {
  const created = await UserModel.create(data);
  return created;
}

/**
 * Registers a new user with hashed password.
 * Uses bcrypt with cost factor 12 for secure password hashing.
 * @param data The registration data.
 * @returns A promise that resolves to the created user and JWT token.
 */
export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<{ user: UserDocument; token: string }> {
  const hashedPassword = await bcrypt.hash(data.password, 12);
  const user = await createUser({
    email: data.email,
    username: data.username,
    passwordHash: hashedPassword,
  });

  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,  // Include username in JWT payload
      role: user.role  // Include role in JWT payload
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}

/**
 * Authenticates a user with email and password.
 * Implements rate limiting: locks account for 15 minutes after 5 failed attempts.
 * Generates a JWT token valid for 24 hours upon successful authentication.
 * @param email The user's email.
 * @param password The user's password.
 * @returns A promise that resolves to the user and JWT token, or null if authentication fails.
 * @throws Error if account is locked.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: UserDocument; token: string } | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  // Check if account is locked
  const lockStatus = checkAccountLock(user);
  if (lockStatus.isLocked) {
    throw new Error(
      `Account is locked due to multiple failed login attempts. ` +
      `Please try again in ${lockStatus.minutesRemaining} minute(s).`
    );
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

  if (!isPasswordValid) {
    // Handle failed login attempt
    await handleFailedLogin(user);

    // Check if this failure triggered a lock
    const newLockStatus = checkAccountLock(user);
    if (newLockStatus.isLocked) {
      throw new Error(
        `Account locked due to too many failed login attempts. ` +
        `Please try again in ${newLockStatus.minutesRemaining} minute(s).`
      );
    }

    // Return null for invalid credentials (don't reveal user exists)
    return null;
  }

  // Successful login - reset attempts
  await resetLoginAttempts(user);

  // Generate token
  const token = jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
      username: user.username,  // Include username in JWT payload
      role: user.role  // Include role in JWT payload
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  return { user, token };
}

/**
 * Bans a user from the platform.
 * @param userId The ID of the user to ban.
 * @param adminId The ID of the admin performing the ban.
 * @param reason The reason for banning the user.
 * @returns A promise that resolves to the updated user document or null if not found.
 */
export async function banUser(
  userId: string,
  adminId: string,
  reason?: string
): Promise<UserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      isBanned: true,
      bannedAt: new Date(),
      bannedBy: adminId,
      banReason: reason || 'No reason provided',
    },
    { new: true }
  ).exec();

  return user;
}

/**
 * Unbans a user from the platform.
 * @param userId The ID of the user to unban.
 * @returns A promise that resolves to the updated user document or null if not found.
 */
export async function unbanUser(userId: string): Promise<UserDocument | null> {
  const user = await UserModel.findByIdAndUpdate(
    userId,
    {
      isBanned: false,
      bannedAt: undefined,
      bannedBy: undefined,
      banReason: undefined,
    },
    { new: true }
  ).exec();

  return user;
}

/**
 * Changes a user's role.
 * @param userId The ID of the user to update.
 * @param newRole The new role to assign.
 * @returns A promise that resolves to the updated user document or null if not found.
 */
export async function changeUserRole(
  userId: string,
  newRole: 'user' | 'curator' | 'admin'
): Promise<UserDocument | null> {
  const updateData: any = { role: newRole };

  // If changing to curator, set curatorStatus to approved
  if (newRole === 'curator') {
    updateData.curatorStatus = 'approved';
    updateData.curatorApprovedAt = new Date();
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).exec();

  return user;
}

/**
 * Searches for users by name, username, or email.
 * @param query The search query string.
 * @returns A promise that resolves to an array of matching user documents.
 */
export async function searchUsers(query: string): Promise<UserDocument[]> {
  const searchRegex = new RegExp(query, 'i'); // Case-insensitive search

  const users = await UserModel.find({
    $or: [
      { username: searchRegex },
      { email: searchRegex },
    ],
  }).exec();

  return users;
}

/**
 * Gets a list of all banned users.
 * @returns A promise that resolves to an array of banned user documents.
 */
export async function getBannedUsers(): Promise<UserDocument[]> {
  return UserModel.find({ isBanned: true })
    .populate('bannedBy', 'username email')
    .exec();
}

/**
 * Gets user profile with betting statistics.
 * @param userId The ID of the user to get profile for.
 * @returns A promise that resolves to the user profile with statistics.
 */
export async function getUserProfile(userId: string): Promise<{
  user: UserDocument;
  statistics: {
    totalBets: number;
    wonBets: number;
    lostBets: number;
    activeBets: number;
    successRate: number;
  };
} | null> {
  const user = await UserModel.findById(userId).exec();
  if (!user) {
    return null;
  }

  // Import WagerModel dynamically to avoid circular dependencies
  const { WagerModel } = await import('../wagers/model');
  const { BetModel } = await import('../bets/model');

  // Get all wagers for this user
  const wagers = await WagerModel.find({ user: userId }).populate('bet').exec();

  let wonBets = 0;
  let lostBets = 0;
  let activeBets = 0;

  for (const wager of wagers) {
    const bet = wager.bet as any;

    if (bet.status === 'settled') {
      // Check if user won or lost
      if (wager.payout && wager.payout > 0) {
        wonBets++;
      } else {
        lostBets++;
      }
    } else if (bet.status === 'open') {
      activeBets++;
    }
  }

  const totalBets = wonBets + lostBets;
  const successRate = totalBets > 0 ? (wonBets / totalBets) * 100 : 0;

  return {
    user,
    statistics: {
      totalBets,
      wonBets,
      lostBets,
      activeBets,
      successRate,
    },
  };
}

/**
 * Updates user profile (username and avatar).
 * @param userId The ID of the user to update.
 * @param data The data to update (username and/or avatar).
 * @returns A promise that resolves to the updated user document or null if not found.
 */
export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    avatar?: string;
  }
): Promise<UserDocument | null> {
  const updateData: any = {};

  if (data.username !== undefined) {
    updateData.username = data.username;
  }

  if (data.avatar !== undefined) {
    updateData.avatar = data.avatar;
  }

  const user = await UserModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).exec();

  return user;
}

/**
 * Checks if a username is available (not already taken).
 * @param username The username to check.
 * @param excludeUserId Optional user ID to exclude from the check (for current user).
 * @returns A promise that resolves to true if username is available, false otherwise.
 */
export async function isUsernameAvailable(
  username: string,
  excludeUserId?: string
): Promise<boolean> {
  const query: any = { username };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const existingUser = await UserModel.findOne(query).exec();
  return !existingUser;
}
