import { Router } from 'express';
import { statsController } from '../controllers/stats.controller.js';

export const statsRouter = Router();

statsRouter.get('/', statsController.dashboard);
