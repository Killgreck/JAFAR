import { Router } from 'express';
import { TransactionController } from './controller';
import { authMiddleware } from '../../middleware/auth';
import { checkBannedUser } from '../../middleware/authorization';

/**
 * Express router for transaction-related routes.
 */
const router = Router();
const controller = new TransactionController();

/**
 * @route GET /api/wallet/:userId/transactions/stats
 * @description Get transaction statistics for a user
 * @access Private (requires authentication, user can only view own stats unless admin)
 */
router.get('/:userId/transactions/stats', authMiddleware, checkBannedUser, controller.getStats.bind(controller));

/**
 * @route GET /api/wallet/:userId/transactions
 * @description Get transaction history for a user with pagination and filters
 * @query type - Filter by transaction type (optional)
 * @query dateFrom - Filter by start date (optional, ISO 8601)
 * @query dateTo - Filter by end date (optional, ISO 8601)
 * @query page - Page number (optional, default: 1)
 * @query limit - Results per page (optional, default: 50, max: 100)
 * @access Private (requires authentication, user can only view own transactions unless admin)
 */
router.get('/:userId/transactions', authMiddleware, checkBannedUser, controller.getUserTransactions.bind(controller));

/**
 * Express router for transaction-related API endpoints.
 * Mounted under /api/wallet
 */
export const transactionsRouter = router;
