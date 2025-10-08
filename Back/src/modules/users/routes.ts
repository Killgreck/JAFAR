import { Router } from 'express';
import { UsersController } from './controller';

const router = Router();
const controller = new UsersController();

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));

export const usersRouter = router;
