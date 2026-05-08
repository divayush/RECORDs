import type { Deal, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import type { DealInput, DealListQuery, DealResponse } from '../models/deal.model.js';
import { statsService } from './stats.service.js';

const moneyToCents = (value: number) => Math.round(value * 100);
const centsToMoney = (value: number) => value / 100;

const serializeDeal = (deal: Deal): DealResponse => ({
  id: deal.id,
  dealAmount: centsToMoney(deal.dealAmount),
  holderFee: centsToMoney(deal.holderFee),
  clientFee: centsToMoney(deal.clientFee),
  holderUsername: deal.holderUsername,
  clientUsername: deal.clientUsername,
  profit: centsToMoney(deal.profit),
  loss: centsToMoney(deal.loss),
  dealDate: deal.dealDate.toISOString(),
  status: deal.status,
  notes: deal.notes,
  createdAt: deal.createdAt.toISOString(),
  updatedAt: deal.updatedAt.toISOString(),
});

const toCreateData = (input: DealInput): Prisma.DealCreateInput => ({
  dealAmount: moneyToCents(input.dealAmount),
  holderFee: moneyToCents(input.holderFee),
  clientFee: moneyToCents(input.clientFee),
  holderUsername: input.holderUsername,
  clientUsername: input.clientUsername,
  profit: moneyToCents(input.profit ?? 0),
  loss: moneyToCents(input.loss ?? 0),
  dealDate: input.dealDate,
  status: input.status,
  notes: input.notes,
});

const toUpdateData = (input: Partial<DealInput>): Prisma.DealUpdateInput => {
  const data: Prisma.DealUpdateInput = {};

  if (input.dealAmount !== undefined) data.dealAmount = moneyToCents(input.dealAmount);
  if (input.holderFee !== undefined) data.holderFee = moneyToCents(input.holderFee);
  if (input.clientFee !== undefined) data.clientFee = moneyToCents(input.clientFee);
  if (input.holderUsername !== undefined) data.holderUsername = input.holderUsername;
  if (input.clientUsername !== undefined) data.clientUsername = input.clientUsername;
  if (input.profit !== undefined) data.profit = moneyToCents(input.profit);
  if (input.loss !== undefined) data.loss = moneyToCents(input.loss);
  if (input.dealDate !== undefined) data.dealDate = input.dealDate;
  if (input.status !== undefined) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes;

  return data;
};

const toWhere = (query: DealListQuery): Prisma.DealWhereInput => {
  const where: Prisma.DealWhereInput = {};
  const and: Prisma.DealWhereInput[] = [];

  if (query.status) {
    where.status = query.status;
  }

  if (query.search) {
    and.push({
      OR: [
        { holderUsername: { contains: query.search } },
        { clientUsername: { contains: query.search } },
        { notes: { contains: query.search } },
      ],
    });
  }

  if (query.dateFrom || query.dateTo) {
    where.dealDate = {
      ...(query.dateFrom ? { gte: query.dateFrom } : {}),
      ...(query.dateTo ? { lte: query.dateTo } : {}),
    };
  }

  if (query.minAmount !== undefined || query.maxAmount !== undefined) {
    where.dealAmount = {
      ...(query.minAmount !== undefined ? { gte: moneyToCents(query.minAmount) } : {}),
      ...(query.maxAmount !== undefined ? { lte: moneyToCents(query.maxAmount) } : {}),
    };
  }

  if (and.length > 0) {
    where.AND = and;
  }

  return where;
};

export const dealsService = {
  async create(input: DealInput) {
    const deal = await prisma.deal.create({
      data: toCreateData(input),
    });

    await statsService.clearCache();
    return serializeDeal(deal);
  },

  async list(query: DealListQuery) {
    const where = toWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        orderBy: {
          dealDate: 'desc',
        },
        skip,
        take: query.pageSize,
      }),
      prisma.deal.count({ where }),
    ]);

    return {
      data: deals.map(serializeDeal),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async getById(id: string) {
    const deal = await prisma.deal.findUnique({
      where: { id },
    });

    return deal ? serializeDeal(deal) : null;
  },

  async update(id: string, input: Partial<DealInput>) {
    const deal = await prisma.deal.update({
      where: { id },
      data: toUpdateData(input),
    });

    await statsService.clearCache();
    return serializeDeal(deal);
  },

  async delete(id: string) {
    await prisma.deal.delete({
      where: { id },
    });
    await statsService.clearCache();
  },
};
