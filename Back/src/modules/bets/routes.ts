import { Router } from 'express';
import { BetsController } from './controller';

/**
 * Express router for bet-related routes.
 */
const router = Router();
const controller = new BetsController();

/**
 * @route GET /api/bets
 * @description Get a list of all bets.
 * @access Public
 */
router.get('/', controller.list.bind(controller));

/**
 * @route GET /api/bets/:id
 * @description Get a bet by its ID.
 * @access Public
 */
router.get('/:id', controller.getById.bind(controller));

/**
 * @route POST /api/bets
 * @description Create a new bet.
 * @access Public
 */
router.post('/', controller.create.bind(controller));

/**
 * @route POST /api/bets/:id/accept
 * @description Accept a bet.
 * @access Public
 */
router.post('/:id/accept', controller.accept.bind(controller));

/**
 * Express router for bet-related API endpoints.
 */
export const betsRouter = router;
