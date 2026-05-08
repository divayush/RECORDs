import type { NextFunction, Request, Response } from 'express';
import type { StatsRange } from '../models/stats.model.js';
import { statsService } from '../services/stats.service.js';

const allowedRanges = new Set<StatsRange>(['24h', 'weekly', 'monthly', 'yearly']);

const getRange = (value: unknown): StatsRange => {
  const range = typeof value === 'string' ? value : 'yearly';

  if (!allowedRanges.has(range as StatsRange)) {
    throw new Error('range must be 24h, weekly, monthly, or yearly.');
  }

  return range as StatsRange;
};

export const statsController = {
  async dashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await statsService.getDashboardStats(getRange(req.query.range));
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  },
};
