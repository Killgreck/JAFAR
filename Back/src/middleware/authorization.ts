import { Request, Response, NextFunction } from 'express';
import { UserModel } from '../modules/users/model';
import type { AuthenticatedRequest } from './auth';

/**
 * Middleware factory to require specific roles.
 * Validates that the authenticated user has one of the required roles.
 *
 * @param roles Array of allowed roles
 * @returns Express middleware function
 *
 * @example
 * router.get('/admin-only', authMiddleware, requireRole(['admin']), handler);
 * router.get('/curator-or-admin', authMiddleware, requireRole(['curator', 'admin']), handler);
 */
export const requireRole = (roles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check if user is authenticated
      if (!req.user?.userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      // Fetch user from database (don't trust JWT alone for authorization)
      const user = await UserModel.findById(req.user.userId).exec();

      if (!user) {
        res.status(401).json({ message: 'User not found' });
        return;
      }

      // Check if user has required role
      if (!roles.includes(user.role)) {
        res.status(403).json({
          message: 'Insufficient permissions',
          required: roles,
          current: user.role,
        });
        return;
      }

      // Add role to request for use in controllers
      req.user.role = user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to require curator role with approved status.
 * More strict than requireRole(['curator']) - also checks curatorStatus.
 *
 * @example
 * router.post('/events/:id/curate', authMiddleware, requireCurator, handler);
 */
export const requireCurator = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await UserModel.findById(req.user.userId).exec();

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Check both role and curatorStatus
    if (user.role !== 'curator' || user.curatorStatus !== 'approved') {
      res.status(403).json({
        message: 'Approved curator access required',
        currentRole: user.role,
        curatorStatus: user.curatorStatus,
      });
      return;
    }

    req.user.role = user.role;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to require admin role.
 * Convenience wrapper around requireRole(['admin']).
 *
 * @example
 * router.post('/curators/approve', authMiddleware, requireAdmin, handler);
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Middleware to require curator OR admin role.
 * Allows both curators and admins to access the endpoint.
 *
 * Note: For curator role, also validates curatorStatus is 'approved'.
 *
 * @example
 * router.get('/events/pending-curation', authMiddleware, requireCuratorOrAdmin, handler);
 */
export const requireCuratorOrAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const user = await UserModel.findById(req.user.userId).exec();

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // Allow admins unconditionally
    if (user.role === 'admin') {
      req.user.role = user.role;
      next();
      return;
    }

    // Allow curators only if approved
    if (user.role === 'curator' && user.curatorStatus === 'approved') {
      req.user.role = user.role;
      next();
      return;
    }

    // Reject everyone else
    res.status(403).json({
      message: 'Curator or admin access required',
      currentRole: user.role,
      curatorStatus: user.curatorStatus,
    });
  } catch (error) {
    next(error);
  }
};
