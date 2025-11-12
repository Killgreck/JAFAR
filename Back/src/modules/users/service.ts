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
 * @param data The registration data.
 * @returns A promise that resolves to the created user and JWT token.
 */
export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<{ user: UserDocument; token: string }> {
  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = await createUser({
    email: data.email,
    username: data.username,
    passwordHash: hashedPassword,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
}

/**
 * Authenticates a user with email and password.
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
    { userId: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
}
