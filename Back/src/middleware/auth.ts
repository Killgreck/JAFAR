import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Extended Request interface to include authenticated user data.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;  // Role from JWT (optional, verified in authorization middleware)
  };
}

/**
 * Middleware to authenticate requests using JWT tokens.
 * Expects Authorization header with format: "Bearer <token>"
 *
 * @param req The request object (extended with user property)
 * @param res The response object
 * @param next The next middleware function
 */
export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      role?: string;
    };

    // Attach user data to request
    // Note: role from JWT is informational only
    // Authorization middleware will verify role from database
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ message: 'Invalid token' });
      return;
    }
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: 'Token expired' });
      return;
    }
    res.status(401).json({ message: 'Authentication failed' });
  }
};
