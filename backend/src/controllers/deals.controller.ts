import type { NextFunction, Request, Response } from 'express';
import { DealStatus, Prisma } from '@prisma/client';
import { dealsService } from '../services/deals.service.js';
import { validateDealCreate, validateDealUpdate } from '../validators/deal.validator.js';
import type { DealListQuery } from '../models/deal.model.js';

const isNotFoundError = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025';

const getDealId = (req: Request) => String(req.params.id ?? req.query.id ?? '');
const allowedStatuses = new Set<string>(Object.values(DealStatus));

const toPositiveInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number(value ?? fallback);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
};

const toOptionalNumber = (value: unknown) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
};

const toOptionalDate = (value: unknown, endOfDay = false) => {
  if (typeof value !== 'string' || value.trim().length === 0) return undefined;
  const date = new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}`);
  return Number.isNaN(date.getTime()) ? undefined : date;
};

const getListQuery = (req: Request): DealListQuery => {
  const status = typeof req.query.status === 'string' ? req.query.status.toUpperCase() : undefined;

  return {
    page: toPositiveInt(req.query.page, 1, 100000),
    pageSize: toPositiveInt(req.query.pageSize, 25, 100),
    search: typeof req.query.search === 'string' && req.query.search.trim() ? req.query.search.trim() : undefined,
    status: status && allowedStatuses.has(status) ? (status as DealStatus) : undefined,
    dateFrom: toOptionalDate(req.query.dateFrom),
    dateTo: toOptionalDate(req.query.dateTo, true),
    minAmount: toOptionalNumber(req.query.minAmount),
    maxAmount: toOptionalNumber(req.query.maxAmount),
  };
};

export const dealsController = {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await dealsService.create(validateDealCreate(req.body));
      res.status(201).json({ data: deal });
    } catch (error) {
      next(error);
    }
  },

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await dealsService.list(getListQuery(req));
      res.json(result);
    } catch (error) {
      next(error);
    }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await dealsService.getById(getDealId(req));

      if (!deal) {
        res.status(404).json({ error: 'Deal not found.' });
        return;
      }

      res.json({ data: deal });
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const deal = await dealsService.update(getDealId(req), validateDealUpdate(req.body));
      res.json({ data: deal });
    } catch (error) {
      if (isNotFoundError(error)) {
        res.status(404).json({ error: 'Deal not found.' });
        return;
      }

      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await dealsService.delete(getDealId(req));
      res.status(204).send();
    } catch (error) {
      if (isNotFoundError(error)) {
        res.status(404).json({ error: 'Deal not found.' });
        return;
      }

      next(error);
    }
  },
};
