import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import type { MongoServerError } from 'mongodb';
import { createUser, getUserById, listUsers, registerUser, loginUser } from './service';
import type { UserDocument } from './model';

const DUPLICATE_KEY_ERROR_CODE = 11000;

type SanitizedUser = {
  id: string;
  email: string;
  username: string;
  createdAt?: Date;
  updatedAt?: Date;
};

/**
 * Sanitizes a user document to remove sensitive information.
 * @param user The user document to sanitize.
 * @returns A sanitized user object.
 */
function sanitizeUser(user: UserDocument): SanitizedUser {
  return {
    id: user._id.toString(),
    email: user.email,
    username: user.username,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

/**
 * Checks if an error is a MongoDB duplicate key error.
 * @param error The error to check.
 * @returns True if the error is a duplicate key error, false otherwise.
 */
function isDuplicateKeyError(error: unknown): error is MongoServerError {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as Partial<MongoServerError>).code === DUPLICATE_KEY_ERROR_CODE
  );
}

/**
 * Checks if a value is a valid Mongoose ObjectId.
 * @param value The value to check.
 * @returns True if the value is a valid ObjectId, false otherwise.
 */
function isValidObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

/**
 * Controller for handling user-related requests.
 */
export class UsersController {
  /**
   * @param _req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns A list of all users.
   */
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await listUsers();
      res.json(users.map(sanitizeUser));
    } catch (error) {
      next(error);
    }
  }

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The user with the specified ID.
   */
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

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The created user.
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        res.status(400).json({ message: 'email, username and password are required' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ message: 'password must be at least 8 characters long' });
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

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The registered user and JWT token.
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        res.status(400).json({ message: 'email, username and password are required' });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ message: 'password must be at least 8 characters long' });
        return;
      }

      const { user, token } = await registerUser({
        email,
        username,
        password,
      });

      res.status(201).json({
        token,
        user: sanitizeUser(user),
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        res.status(409).json({ message: 'User with the provided email or username already exists' });
        return;
      }

      next(error);
    }
  }

  /**
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The authenticated user and JWT token.
   */
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ message: 'email and password are required' });
        return;
      }

      const result = await loginUser(email, password);

      if (!result) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      res.json({
        token: result.token,
        user: sanitizeUser(result.user),
      });
    } catch (error) {
      next(error);
    }
  }
}
