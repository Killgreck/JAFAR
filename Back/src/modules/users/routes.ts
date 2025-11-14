import { Router } from 'express';
import { UsersController } from './controller';
import { authMiddleware } from '../../middleware/auth';
import { requireAdmin, checkBannedUser } from '../../middleware/authorization';

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
 * @route GET /api/users/profile
 * @description Get the authenticated user's profile with statistics.
 * @access Private (requires authentication)
 */
router.get('/profile', authMiddleware, checkBannedUser, controller.getProfile.bind(controller));

/**
 * @route PUT /api/users/profile
 * @description Update the authenticated user's profile (username and avatar).
 * @access Private (requires authentication)
 */
router.put('/profile', authMiddleware, checkBannedUser, controller.updateProfile.bind(controller));

/**
 * @route GET /api/users/search
 * @description Search for users by username or email.
 * @access Private (requires admin role)
 */
router.get('/search', authMiddleware, checkBannedUser, requireAdmin, controller.search.bind(controller));

/**
 * @route GET /api/users/banned
 * @description Get a list of all banned users.
 * @access Private (requires admin role)
 */
router.get('/banned', authMiddleware, checkBannedUser, requireAdmin, controller.getBanned.bind(controller));

/**
 * @route POST /api/users/:id/ban
 * @description Ban a user from the platform.
 * @access Private (requires admin role)
 */
router.post('/:id/ban', authMiddleware, checkBannedUser, requireAdmin, controller.ban.bind(controller));

/**
 * @route POST /api/users/:id/unban
 * @description Unban a user from the platform.
 * @access Private (requires admin role)
 */
router.post('/:id/unban', authMiddleware, checkBannedUser, requireAdmin, controller.unban.bind(controller));

/**
 * @route PATCH /api/users/:id/role
 * @description Change a user's role.
 * @access Private (requires admin role)
 */
router.patch('/:id/role', authMiddleware, checkBannedUser, requireAdmin, controller.changeRole.bind(controller));

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
