import { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../middleware/auth';
import {
  createCuratorRequest,
  listCuratorRequests,
  getCuratorRequestById,
  approveCuratorRequest,
  rejectCuratorRequest,
  listApprovedCurators,
  getUserCuratorRequest,
} from './service';

/**
 * Controller for handling curator-related requests.
 */
export class CuratorsController {
  /**
   * Submit a curator application.
   * POST /api/curators/request
   * @access Private (authenticated users)
   */
  async requestCurator(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { reason, experience } = req.body;

      // Validation
      if (!reason || !experience) {
        res.status(400).json({ message: 'reason and experience are required' });
        return;
      }

      if (reason.length < 50 || reason.length > 500) {
        res.status(400).json({
          message: 'reason must be between 50 and 500 characters',
        });
        return;
      }

      if (experience.length < 20 || experience.length > 1000) {
        res.status(400).json({
          message: 'experience must be between 20 and 1000 characters',
        });
        return;
      }

      const request = await createCuratorRequest(userId, { reason, experience });

      res.status(201).json({
        message: 'Curator request submitted successfully',
        request: {
          id: request._id,
          status: request.status,
          createdAt: request.createdAt,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('already have') ||
          error.message.includes('already a curator')
        ) {
          res.status(409).json({ message: error.message });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Get user's own curator request.
   * GET /api/curators/my-request
   * @access Private (authenticated users)
   */
  async getMyRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const request = await getUserCuratorRequest(userId);

      if (!request) {
        res.status(404).json({ message: 'No curator request found' });
        return;
      }

      res.json({
        id: request._id,
        reason: request.reason,
        experience: request.experience,
        status: request.status,
        reviewedBy: request.reviewedBy,
        reviewedAt: request.reviewedAt,
        reviewNotes: request.reviewNotes,
        createdAt: request.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * List all curator requests (admin only).
   * GET /api/curators/requests
   * @access Admin only
   */
  async listRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { status } = req.query;

      const requests = await listCuratorRequests({
        status: status as string | undefined,
      });

      res.json(
        requests.map((r) => ({
          id: r._id,
          user: {
            id: (r.user as any)._id,
            email: (r.user as any).email,
            username: (r.user as any).username,
            createdAt: (r.user as any).createdAt,
          },
          reason: r.reason,
          experience: r.experience,
          status: r.status,
          reviewedBy: r.reviewedBy
            ? {
                id: (r.reviewedBy as any)._id,
                email: (r.reviewedBy as any).email,
                username: (r.reviewedBy as any).username,
              }
            : null,
          reviewedAt: r.reviewedAt,
          reviewNotes: r.reviewNotes,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
        }))
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get specific curator request details (admin only).
   * GET /api/curators/requests/:id
   * @access Admin only
   */
  async getRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const request = await getCuratorRequestById(id);

      if (!request) {
        res.status(404).json({ message: 'Curator request not found' });
        return;
      }

      res.json({
        id: request._id,
        user: {
          id: (request.user as any)._id,
          email: (request.user as any).email,
          username: (request.user as any).username,
          createdAt: (request.user as any).createdAt,
        },
        reason: request.reason,
        experience: request.experience,
        status: request.status,
        reviewedBy: request.reviewedBy
          ? {
              id: (request.reviewedBy as any)._id,
              email: (request.reviewedBy as any).email,
              username: (request.reviewedBy as any).username,
            }
          : null,
        reviewedAt: request.reviewedAt,
        reviewNotes: request.reviewNotes,
        createdAt: request.createdAt,
        updatedAt: request.updatedAt,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve a curator request (admin only).
   * POST /api/curators/requests/:id/approve
   * @access Admin only
   */
  async approveRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { request, user } = await approveCuratorRequest(id, adminId, notes);

      res.json({
        message: 'Curator request approved successfully',
        request: {
          id: request._id,
          status: request.status,
          reviewedAt: request.reviewedAt,
        },
        user: {
          id: user._id,
          email: user.email,
          username: user.username,
          role: user.role,
          curatorStatus: user.curatorStatus,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('expected pending')
        ) {
          res.status(400).json({ message: error.message });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * Reject a curator request (admin only).
   * POST /api/curators/requests/:id/reject
   * @access Admin only
   */
  async rejectRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminId = req.user?.userId;

      if (!adminId) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      if (!notes || notes.trim().length === 0) {
        res.status(400).json({ message: 'notes (rejection reason) is required' });
        return;
      }

      const request = await rejectCuratorRequest(id, adminId, notes);

      res.json({
        message: 'Curator request rejected',
        request: {
          id: request._id,
          status: request.status,
          reviewedAt: request.reviewedAt,
          reviewNotes: request.reviewNotes,
        },
      });
    } catch (error) {
      if (error instanceof Error) {
        if (
          error.message.includes('not found') ||
          error.message.includes('expected pending')
        ) {
          res.status(400).json({ message: error.message });
          return;
        }
      }
      next(error);
    }
  }

  /**
   * List all approved curators (public).
   * GET /api/curators
   * @access Public
   */
  async listCurators(req: Request, res: Response, next: NextFunction) {
    try {
      const curators = await listApprovedCurators();

      res.json(
        curators.map((c) => ({
          id: c._id,
          username: c.username,
          email: c.email,
          curatorApprovedAt: c.curatorApprovedAt,
          approvedBy: c.curatorApprovedBy
            ? {
                username: (c.curatorApprovedBy as any).username,
              }
            : null,
        }))
      );
    } catch (error) {
      next(error);
    }
  }
}
