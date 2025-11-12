import { Router } from 'express';
import { WagersController } from './controller';

const router = Router();
const controller = new WagersController();

/**
 * @route POST /api/wagers
 * @description Place a wager on a prediction
 * @access Public
 */
router.post('/', controller.placeWager.bind(controller));

/**
 * @route GET /api/wagers/bet/:betId
 * @description Get all wagers for a specific bet
 * @access Public
 */
router.get('/bet/:betId', controller.getByBet.bind(controller));

/**
 * @route GET /api/wagers/user/:userId
 * @description Get all wagers for a specific user
 * @access Public
 */
router.get('/user/:userId', controller.getByUser.bind(controller));

export const wagersRouter = router;
