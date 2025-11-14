import { Router } from 'express';
import { EventController } from './controller';
import { EvidenceController } from '../evidence/controller';
import { authMiddleware } from '../../middleware/auth';

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
 * @description Update the status of an event
 * @access Private (requires authentication)
 */
router.put('/:id/status', authMiddleware, controller.updateStatus.bind(controller));

/**
 * @route POST /api/events/:id/resolve
 * @description Resolve an event with a winning option
 * @access Private (requires authentication)
 */
router.post('/:id/resolve', authMiddleware, controller.resolve.bind(controller));

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
 * Express router for event-related API endpoints.
 */
export const eventsRouter = router;
