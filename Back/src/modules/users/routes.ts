import { Router } from 'express';
import { UsersController } from './controller';
import { authMiddleware } from '../../middleware/auth';

/**
 * Express router for user-related routes.
 */
const router = Router();
const controller = new UsersController();

/**
 * @route POST /api/users/register
 * @description Register a new user and receive a JWT token.
 * @access Public
 */
router.post('/register', controller.register.bind(controller));

/**
 * @route POST /api/users/login
 * @description Login with email and password to receive a JWT token.
 * @access Public
 */
router.post('/login', controller.login.bind(controller));

/**
 * @route GET /api/users/me
 * @description Get the authenticated user's profile.
 * @access Private (requires authentication)
 */
router.get('/me', authMiddleware, controller.getMe.bind(controller));

/**
 * @route GET /api/users/:id
 * @description Get a user by their ID (only accessible by the user themselves).
 * @access Private (requires authentication)
 */
router.get('/:id', authMiddleware, controller.getById.bind(controller));

/**
 * Express router for user-related API endpoints.
 */
export const usersRouter = router;
