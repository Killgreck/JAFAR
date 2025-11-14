import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserModel, UserDocument } from './model';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
 * Generates a JWT token valid for 24 hours upon successful authentication.
 * @param email The user's email.
 * @param password The user's password.
 * @returns A promise that resolves to the user and JWT token, or null if authentication fails.
 */
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: UserDocument; token: string } | null> {
  const user = await getUserByEmail(email);
  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return null;
  }

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
