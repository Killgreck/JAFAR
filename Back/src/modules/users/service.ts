import { UserModel, UserDocument } from './model';

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
