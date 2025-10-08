import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import type { MongoServerError } from 'mongodb';
import { createUser, getUserById, listUsers } from './service';
import type { UserDocument } from './model';

const DUPLICATE_KEY_ERROR_CODE = 11000;

type SanitizedUser = {
  id: string;
  email: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
};

function sanitizeUser(user: UserDocument): SanitizedUser {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as Partial<MongoServerError>).code === DUPLICATE_KEY_ERROR_CODE
  );
}

function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

export class UsersController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await listUsers();
      res.json(users.map(sanitizeUser));
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      const user = await getUserById(id);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      res.json(sanitizeUser(user));
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        res.status(400).json({ message: 'email, username and password are required' });
        return;
      }

      const created = await createUser({
        email,
        username,
        passwordHash: password,
      });

      res.status(201).json(sanitizeUser(created));
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ message: 'User with the provided email or username already exists' });
        return;
      }

      next(error);
    }
  }
}
