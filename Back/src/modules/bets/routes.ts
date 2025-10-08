import { Router } from 'express';
import { BetsController } from './controller';

const router = Router();
const controller = new BetsController();

router.get('/', controller.list.bind(controller));
router.get('/:id', controller.getById.bind(controller));
router.post('/', controller.create.bind(controller));

export const betsRouter = router;
