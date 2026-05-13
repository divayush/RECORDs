import { Router } from 'express';
import { spendingsController } from '../controllers/spendings.controller.js';

export const spendingsRouter = Router();

spendingsRouter.post('/', spendingsController.create);
spendingsRouter.get('/', spendingsController.list);
spendingsRouter.get('/stats', spendingsController.stats);
spendingsRouter.delete('/', spendingsController.delete);
