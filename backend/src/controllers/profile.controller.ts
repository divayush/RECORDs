import type { Request, Response } from 'express';
import { profileService } from '../services/profile.service.js';

export const profileController = {
  async get(_req: Request, res: Response) {
    const profile = await profileService.get();
    res.json({ data: profile });
  },

  async update(req: Request, res: Response) {
    const fullName = typeof req.body.fullName === 'string' ? req.body.fullName.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim() : null;

    if (!fullName) {
      res.status(400).json({ error: 'Full name is required.' });
      return;
    }

    const profile = await profileService.update({ fullName, email });
    res.json({ data: profile });
  },
};
