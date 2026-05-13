import type { Spending, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import type { SpendingInput, SpendingListQuery, SpendingResponse, SpendingStatsResponse } from '../models/spending.model.js';

const moneyToCents = (value: number) => Math.round(value * 100);
const centsToMoney = (value: number) => value / 100;

const serializeSpending = (spending: Spending): SpendingResponse => ({
  id: spending.id,
  sentTo: spending.sentTo,
  forWhat: spending.forWhat,
  sentWhat: centsToMoney(spending.sentWhat),
  notes: spending.notes,
  spentAt: spending.spentAt.toISOString(),
  createdAt: spending.createdAt.toISOString(),
  updatedAt: spending.updatedAt.toISOString(),
});

const toWhere = (query: SpendingListQuery): Prisma.SpendingWhereInput => {
  if (!query.search) return {};

  return {
    OR: [
      { sentTo: { contains: query.search } },
      { forWhat: { contains: query.search } },
      { notes: { contains: query.search } },
    ],
  };
};

export const spendingsService = {
  async create(input: SpendingInput) {
    const spending = await prisma.spending.create({
      data: {
        sentTo: input.sentTo,
        forWhat: input.forWhat,
        sentWhat: moneyToCents(input.sentWhat),
        notes: input.notes,
        spentAt: input.spentAt,
      },
    });

    return serializeSpending(spending);
  },

  async list(query: SpendingListQuery) {
    const where = toWhere(query);
    const skip = (query.page - 1) * query.pageSize;

    const [spendings, total] = await Promise.all([
      prisma.spending.findMany({
        where,
        orderBy: { spentAt: 'desc' },
        skip,
        take: query.pageSize,
      }),
      prisma.spending.count({ where }),
    ]);

    return {
      data: spendings.map(serializeSpending),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  },

  async delete(id: string) {
    await prisma.spending.delete({ where: { id } });
  },

  async stats(): Promise<SpendingStatsResponse> {
    const spendings = await prisma.spending.findMany({
      orderBy: { spentAt: 'desc' },
    });

    const byPurpose = new Map<string, number>();
    let totalSpent = 0;

    spendings.forEach((spending) => {
      totalSpent += spending.sentWhat;
      byPurpose.set(spending.forWhat, (byPurpose.get(spending.forWhat) ?? 0) + spending.sentWhat);
    });

    return {
      totals: {
        spent: centsToMoney(totalSpent),
        records: spendings.length,
      },
      byPurpose: Array.from(byPurpose.entries())
        .map(([name, amount]) => ({ name, amount: centsToMoney(amount) }))
        .sort((first, second) => second.amount - first.amount)
        .slice(0, 8),
      recentSpendings: spendings.slice(0, 10).map(serializeSpending),
    };
  },
};
