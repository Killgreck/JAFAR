import { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import type { MongoServerError } from 'mongodb';
import {
  getUserById,
  registerUser,
  loginUser,
  banUser,
  unbanUser,
  changeUserRole,
  searchUsers,
  getBannedUsers,
} from './service';
import type { UserDocument } from './model';

const DUPLICATE_KEY_ERROR_CODE = 11000;

type SanitizedUser = {
  id: string;
  email: string;
  username: string;
  balance: number;
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
    balance: user.balance ?? 25,
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
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   * @returns The authenticated user's profile.
   */
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.userId;

      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const user = await getUserById(userId);
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
   * @returns The user with the specified ID (only if authorized).
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const authenticatedUserId = (req as any).user?.userId;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      // Authorization check: users can only view their own profile
      if (id !== authenticatedUserId) {
        res.status(403).json({ message: 'You can only view your own profile' });
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
   * @returns The registered user and JWT token.
   */
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, username, password } = req.body;

      if (!email || !username || !password) {
        res.status(400).json({ message: 'email, username and password are required' });
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({ message: 'email must be a valid email address' });
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

      try {
        const result = await loginUser(email, password);

        if (!result) {
          res.status(401).json({ message: 'Invalid email or password' });
          return;
        }

        res.json({
          token: result.token,
          user: sanitizeUser(result.user),
        });
      } catch (loginError: any) {
        // Check if it's an account lock error
        if (loginError.message && loginError.message.includes('locked')) {
          res.status(429).json({
            message: loginError.message,
            error: 'ACCOUNT_LOCKED'
          });
          return;
        }
        // Re-throw other errors
        throw loginError;
      }
    } catch (error) {
      next(error);
    }
  }

  /**
   * Bans a user from the platform (admin only).
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   */
  async ban(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = (req as any).user?.userId;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      // Check if trying to ban themselves
      if (id === adminId) {
        res.status(400).json({ message: 'You cannot ban yourself' });
        return;
      }

      const user = await banUser(id, adminId, reason);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: 'User banned successfully',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          isBanned: user.isBanned,
          bannedAt: user.bannedAt,
          banReason: user.banReason,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unbans a user from the platform (admin only).
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   */
  async unban(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      const user = await unbanUser(id);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: 'User unbanned successfully',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          isBanned: user.isBanned,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Changes a user's role (admin only).
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   */
  async changeRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { role } = req.body;
      const adminId = (req as any).user?.userId;

      if (!isValidObjectId(id)) {
        res.status(400).json({ message: 'id must be a valid identifier' });
        return;
      }

      if (!role || !['user', 'curator', 'admin'].includes(role)) {
        res.status(400).json({ message: 'Valid role is required (user, curator, or admin)' });
        return;
      }

      // Check if trying to change their own role
      if (id === adminId) {
        res.status(400).json({ message: 'You cannot change your own role' });
        return;
      }

      const user = await changeUserRole(id, role);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({
        message: 'User role changed successfully',
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          curatorStatus: user.curatorStatus,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Searches for users by name, username, or email (admin only).
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   */
  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        res.status(400).json({ message: 'Search query (q) is required' });
        return;
      }

      const users = await searchUsers(q);

      res.json({
        users: users.map((user) => ({
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          role: user.role,
          isBanned: user.isBanned,
          curatorStatus: user.curatorStatus,
        })),
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Gets a list of all banned users (admin only).
   * @param req The request object.
   * @param res The response object.
   * @param next The next middleware function.
   */
  async getBanned(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await getBannedUsers();

      res.json({
        users: users.map((user) => ({
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          isBanned: user.isBanned,
          bannedAt: user.bannedAt,
          bannedBy: user.bannedBy,
          banReason: user.banReason,
        })),
        count: users.length,
      });
    } catch (error) {
      next(error);
    }
  }
}
