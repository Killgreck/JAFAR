import { Router } from 'express';
import { EventController } from './controller';
import { EvidenceController } from '../evidence/controller';
import { authMiddleware } from '../../middleware/auth';
import { requireAdmin, requireCuratorOrAdmin, checkBannedUser } from '../../middleware/authorization';

/**
 * Express router for event-related routes.
 */
const router = Router();
const controller = new EventController();
const evidenceController = new EvidenceController();

/**
 * @route POST /api/events
 * @description Create a new betting event
 * @access Private (requires authentication)
 */
router.post('/', authMiddleware, controller.create.bind(controller));

/**
 * @route GET /api/events
 * @description List all events with optional filters
 * @query category - Filter by category (optional)
 * @query status - Filter by status (optional)
 * @query creator - Filter by creator ID (optional)
 * @access Private (requires authentication)
 */
router.get('/', authMiddleware, controller.list.bind(controller));

/**
 * @route GET /api/events/:id
 * @description Get a specific event by ID
 * @access Private (requires authentication)
 */
router.get('/:id', authMiddleware, controller.getById.bind(controller));

/**
 * @route PUT /api/events/:id/status
 * @description Update the status of an event (admin only)
 * @access Private (requires admin role)
 */
router.put('/:id/status', authMiddleware, checkBannedUser, requireAdmin, controller.updateStatus.bind(controller));

/**
 * @route POST /api/events/:id/resolve
 * @description Resolve an event with a winning option (curator or admin only)
 * @access Private (requires curator or admin role)
 */
router.post('/:id/resolve', authMiddleware, checkBannedUser, requireCuratorOrAdmin, controller.resolve.bind(controller));

/**
 * @route POST /api/events/:id/cancel
 * @description Cancel an event and refund all wagers (admin only)
 * @access Private (requires admin role)
 */
router.post('/:id/cancel', authMiddleware, checkBannedUser, requireAdmin, controller.cancel.bind(controller));

/**
 * @route PATCH /api/events/:id/dates
 * @description Update the dates of an event (admin only)
 * @access Private (requires admin role)
 */
router.patch('/:id/dates', authMiddleware, checkBannedUser, requireAdmin, controller.updateDates.bind(controller));

/**
 * @route GET /api/events/curation/ready
 * @description Get events ready for curation (curator or admin only)
 * @access Private (requires curator or admin role)
 */
router.get('/curation/ready', authMiddleware, checkBannedUser, requireCuratorOrAdmin, controller.getEventsForCuration.bind(controller));

/**
 * @route POST /api/events/:eventId/evidence
 * @description Submit evidence for an event
 * @access Private (requires authentication)
 */
router.post('/:eventId/evidence', authMiddleware, evidenceController.submitEvidence.bind(evidenceController));

/**
 * @route GET /api/events/:eventId/evidence
 * @description Get all evidence for an event
 * @access Public
 */
router.get('/:eventId/evidence', evidenceController.getEventEvidence.bind(evidenceController));

/**
 * @route POST /api/events/:eventId/evidence/:evidenceId/like
 * @description Like an evidence
 * @access Private (requires authentication)
 */
router.post('/:eventId/evidence/:evidenceId/like', authMiddleware, checkBannedUser, evidenceController.likeEvidence.bind(evidenceController));

/**
 * @route DELETE /api/events/:eventId/evidence/:evidenceId/like
 * @description Unlike an evidence
 * @access Private (requires authentication)
 */
router.delete('/:eventId/evidence/:evidenceId/like', authMiddleware, checkBannedUser, evidenceController.unlikeEvidence.bind(evidenceController));

/**
 * Express router for event-related API endpoints.
 */
export const eventsRouter = router;
