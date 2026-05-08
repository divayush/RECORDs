import { Router } from 'express';
import { dealsController } from '../controllers/deals.controller.js';

export const dealsRouter = Router();

dealsRouter.post('/', dealsController.create);
dealsRouter.get('/', dealsController.list);
dealsRouter.get('/:id', dealsController.getById);
dealsRouter.put('/:id', dealsController.update);
dealsRouter.delete('/:id', dealsController.delete);
