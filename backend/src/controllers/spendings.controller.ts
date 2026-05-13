import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { spendingsService } from '../services/spendings.service.js';
import { validateSpendingCreate } from '../validators/spending.validator.js';

const isNotFoundError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

const toPositiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const getSpendingId = (req: Request) => String(req.params.id ?? req.query.id ?? '');

export const spendingsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const spending = await spendingsService.create(validateSpendingCreate(req.body));
      res.status(201).json({ data: spending });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await spendingsService.list({
        page: toPositiveInt(req.query.page, 1, 100000),
        pageSize: toPositiveInt(req.query.pageSize, 25, 100),
        search: typeof req.query.search === 'string' && req.query.search.trim() ? req.query.search.trim() : undefined,
      });
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async stats(_req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await spendingsService.stats();
      res.json({ data: stats });
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await spendingsService.delete(getSpendingId(req));
      res.status(204).send();
    } catch (error) {
      if (isNotFoundError(error)) {
        res.status(404).json({ error: 'Spending record not found.' });
        return;
      }

      next(error);
    }
  },
};
