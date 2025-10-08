import { UserModel, UserDocument } from './model';

export async function listUsers(): Promise<UserDocument[]> {
  return UserModel.find().exec();
}

export async function getUserById(id: string): Promise<UserDocument | null> {
  return UserModel.findById(id).exec();
}

export async function createUser(data: {
  email: string;
  username: string;
  passwordHash: string;
}): Promise<UserDocument> {
  const created = await UserModel.create(data);
  return created;
}
