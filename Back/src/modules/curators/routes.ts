import { Router } from 'express';
import { CuratorsController } from './controller';
import { authMiddleware } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/authorization';

/**
 * Express router for curator-related routes.
 */
const router = Router();
const controller = new CuratorsController();

/**
 * @route POST /api/curators/request
 * @description Submit a curator application
 * @access Private (authenticated users)
 * @body { reason: string (50-500 chars), experience: string (20-1000 chars) }
 */
router.post('/request', authMiddleware, controller.requestCurator.bind(controller));

/**
 * @route GET /api/curators/my-request
 * @description Get authenticated user's curator request
 * @access Private (authenticated users)
 */
router.get('/my-request', authMiddleware, controller.getMyRequest.bind(controller));

/**
 * @route GET /api/curators/requests
 * @description List all curator requests (admin only)
 * @access Admin only
 * @query { status?: 'pending' | 'approved' | 'rejected' }
 */
router.get(
  '/requests',
  authMiddleware,
  requireAdmin,
  controller.listRequests.bind(controller)
);

/**
 * @route GET /api/curators/requests/:id
 * @description Get specific curator request details (admin only)
 * @access Admin only
 */
router.get(
  '/requests/:id',
  authMiddleware,
  requireAdmin,
  controller.getRequest.bind(controller)
);

/**
 * @route POST /api/curators/requests/:id/approve
 * @description Approve a curator request
 * @access Admin only
 * @body { notes?: string } - Optional approval notes
 */
router.post(
  '/requests/:id/approve',
  authMiddleware,
  requireAdmin,
  controller.approveRequest.bind(controller)
);

/**
 * @route POST /api/curators/requests/:id/reject
 * @description Reject a curator request
 * @access Admin only
 * @body { notes: string } - Rejection reason (required)
 */
router.post(
  '/requests/:id/reject',
  authMiddleware,
  requireAdmin,
  controller.rejectRequest.bind(controller)
);

/**
 * @route GET /api/curators
 * @description List all approved curators (public)
 * @access Public
 */
router.get('/', controller.listCurators.bind(controller));

/**
 * Express router for curator-related API endpoints.
 */
export const curatorsRouter = router;
