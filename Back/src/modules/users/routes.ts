import { Router } from 'express';
import { UsersController } from './controller';

/**
 * Express router for user-related routes.
 */
const router = Router();
const controller = new UsersController();

/**
 * @route GET /api/users
 * @description Get a list of all users.
 * @access Public
 */
router.get('/', controller.list.bind(controller));

/**
 * @route GET /api/users/:id
 * @description Get a user by their ID.
 * @access Public
 */
router.get('/:id', controller.getById.bind(controller));

/**
 * @route POST /api/users
 * @description Create a new user.
 * @access Public
 */
router.post('/', controller.create.bind(controller));

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
 * Express router for user-related API endpoints.
 */
export const usersRouter = router;
