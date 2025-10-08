import { Router } from 'express';
import { WalletController } from './controller';

const router = Router();
const controller = new WalletController();

router.get('/:userId', controller.getByUser.bind(controller));
router.post('/', controller.create.bind(controller));
router.put('/:userId/balance', controller.updateBalance.bind(controller));

export const walletRouter = router;
