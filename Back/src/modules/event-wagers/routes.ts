import { Router } from 'express';
import { EventWagersController } from './controller';
import { authMiddleware } from '../../middleware/auth';
import { requireCuratorOrAdmin } from '../../middleware/authorization';

/**
 * Express router for event wager-related routes.
 */
const router = Router();
const controller = new EventWagersController();

/**
 * @route POST /api/event-wagers
 * @description Place a wager on an event
 * @access Private (authenticated users)
 * @body { eventId: string, selectedOption: string, amount: number }
 */
router.post('/', authMiddleware, controller.placeWager.bind(controller));

/**
 * @route GET /api/event-wagers/my-wagers
 * @description Get authenticated user's wagers
 * @access Private (authenticated users)
 * @query { settled?: 'true' | 'false' } - Optional filter
 */
router.get('/my-wagers', authMiddleware, controller.getMyWagers.bind(controller));

/**
 * @route GET /api/event-wagers/event/:eventId
 * @description Get all wagers for a specific event
 * @access Public
 */
router.get('/event/:eventId', controller.getEventWagers.bind(controller));

/**
 * @route GET /api/event-wagers/event/:eventId/stats
 * @description Get wagering statistics for an event
 * @access Public
 */
router.get('/event/:eventId/stats', controller.getEventStats.bind(controller));

/**
 * @route GET /api/event-wagers/:id
 * @description Get a specific wager by ID
 * @access Public
 */
router.get('/:id', controller.getWager.bind(controller));

/**
 * @route POST /api/event-wagers/settle/:eventId
 * @description Settle an event and distribute payouts
 * @access Private (curators and admins only)
 * @body { winningOption: string }
 */
router.post(
  '/settle/:eventId',
  authMiddleware,
  requireCuratorOrAdmin,
  controller.settleEventWagers.bind(controller)
);

/**
 * Express router for event wager-related API endpoints.
 */
export const eventWagersRouter = router;
