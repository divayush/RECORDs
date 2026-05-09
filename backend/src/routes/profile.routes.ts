import { Router } from 'express';
import { profileController } from '../controllers/profile.controller.js';

export const profileRouter = Router();

profileRouter.get('/', profileController.get);
profileRouter.put('/', profileController.update);
