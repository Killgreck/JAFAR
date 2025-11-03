import { Router } from 'express';
import { WalletController } from './controller';

/**
 * Express router for wallet-related routes.
 */
const router = Router();
const controller = new WalletController();

/**
 * @route GET /api/wallet/:userId
 * @description Get a wallet by user ID.
 * @access Public
 */
router.get('/:userId', controller.getByUser.bind(controller));

/**
 * @route POST /api/wallet
 * @description Create a new wallet.
 * @access Public
 */
router.post('/', controller.create.bind(controller));

/**
 * @route PUT /api/wallet/:userId/balance
 * @description Update the balance of a wallet.
 * @access Public
 */
router.put('/:userId/balance', controller.updateBalance.bind(controller));

/**
 * Express router for wallet-related API endpoints.
 */
export const walletRouter = router;
