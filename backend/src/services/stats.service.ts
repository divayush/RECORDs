import type { Deal, Prisma } from '@prisma/client';
import { prisma } from '../config/database.js';
import type { DealResponse } from '../models/deal.model.js';
import type { ChartPoint, StatsRange, StatsResponse } from '../models/stats.model.js';

const centsToMoney = (value: number) => value / 100;
const getCalculatedProfitCents = (deal: Deal) => deal.clientFee - deal.holderFee - (deal.serverFee ?? 0);
const INDIA_TIME_ZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
const CACHE_TTL_MS = 60 * 1000;

const serializeDeal = (deal: Deal): DealResponse => ({
  id: deal.id,
  dealAmount: centsToMoney(deal.dealAmount),
  holderFee: centsToMoney(deal.holderFee),
  clientFee: centsToMoney(deal.clientFee),
  serverFee: centsToMoney(deal.serverFee ?? 0),
  holderUsername: deal.holderUsername,
  clientUsername: deal.clientUsername,
  serverName: deal.serverName,
  profit: centsToMoney(getCalculatedProfitCents(deal)),
  loss: 0,
  dealDate: deal.dealDate.toISOString(),
  status: deal.status,
  notes: deal.notes,
  createdAt: deal.createdAt.toISOString(),
  updatedAt: deal.updatedAt.toISOString(),
});

const getIstParts = (date: Date) => {
  const istDate = new Date(date.getTime() + IST_OFFSET_MS);

  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth(),
    day: istDate.getUTCDate(),
    weekday: istDate.getUTCDay(),
  };
};

const fromIstParts = (year: number, month: number, day: number) =>
  new Date(Date.UTC(year, month, day) - IST_OFFSET_MS);

const startOfDay = (date: Date) => {
  const parts = getIstParts(date);
  return fromIstParts(parts.year, parts.month, parts.day);
};
const startOfWeek = (date: Date) => {
  const dayStart = startOfDay(date);
  const { weekday } = getIstParts(date);
  return addDays(dayStart, -weekday);
};
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * 60 * 60 * 1000);
const addMonths = (date: Date, months: number) => {
  const parts = getIstParts(date);
  return fromIstParts(parts.year, parts.month + months, 1);
};

const getRangeWindow = (range: StatsRange, now = new Date()) => {
  if (range === '24h') {
    const start = startOfDay(now);
    const end = addDays(start, 1);
    const previousStart = addDays(start, -1);

    return { start, end, previousStart, previousEnd: start };
  }

  if (range === 'weekly') {
    const start = startOfWeek(now);
    const end = addDays(start, 7);
    const previousStart = addDays(start, -7);

    return { start, end, previousStart, previousEnd: start };
  }

  if (range === 'monthly') {
    const nowParts = getIstParts(now);
    const start = fromIstParts(nowParts.year, nowParts.month, 1);
    const end = addMonths(start, 1);
    const previousStart = addMonths(start, -1);

    return { start, end, previousStart, previousEnd: start };
  }

  const nowParts = getIstParts(now);
  const start = fromIstParts(nowParts.year, 0, 1);
  const end = fromIstParts(nowParts.year + 1, 0, 1);
  const previousStart = fromIstParts(nowParts.year - 1, 0, 1);

  return { start, end, previousStart, previousEnd: start };
};

const getBucketStarts = (range: StatsRange, start: Date, end: Date) => {
  if (range === '24h') {
    return Array.from({ length: 6 }, (_, index) => addHours(start, index * 4));
  }

  if (range === 'weekly') {
    return Array.from({ length: 7 }, (_, index) => addDays(start, index));
  }

  if (range === 'monthly') {
    return Array.from({ length: 4 }, (_, index) => {
      const dayOffset = Math.floor(index * ((end.getTime() - start.getTime()) / 4) / (24 * 60 * 60 * 1000));
      return addDays(start, dayOffset);
    });
  }

  return Array.from({ length: 12 }, (_, index) => {
    const parts = getIstParts(start);
    return fromIstParts(parts.year, index, 1);
  });
};

const getBucketEnd = (range: StatsRange, bucketStart: Date, bucketIndex: number, allBuckets: Date[], rangeEnd: Date) => {
  if (bucketIndex < allBuckets.length - 1) {
    return allBuckets[bucketIndex + 1];
  }

  if (range === '24h') return addHours(bucketStart, 4);
  if (range === 'weekly') return addDays(bucketStart, 1);
  if (range === 'monthly') return rangeEnd;
  return addMonths(bucketStart, 1);
};

const formatBucketLabel = (range: StatsRange, date: Date) => {
  if (range === '24h') {
    return date.toLocaleTimeString('en-US', {
      timeZone: INDIA_TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  if (range === 'weekly') {
    return date.toLocaleDateString('en-US', { timeZone: INDIA_TIME_ZONE, weekday: 'short' });
  }

  if (range === 'monthly') {
    const week = Math.floor((getIstParts(date).day - 1) / 7) + 1;
    return `Week ${week}`;
  }

  return date.toLocaleDateString('en-US', { timeZone: INDIA_TIME_ZONE, month: 'short' });
};

const sumDeals = (deals: Deal[]) =>
  deals.reduce(
    (totals, deal) => ({
      profit: totals.profit + getCalculatedProfitCents(deal),
      volume: totals.volume + deal.dealAmount,
      dealAmount: totals.dealAmount + deal.dealAmount,
      holderFees: totals.holderFees + deal.holderFee,
      clientFees: totals.clientFees + deal.clientFee,
      serverFees: totals.serverFees + (deal.serverFee ?? 0),
      deals: totals.deals + 1,
    }),
    {
      profit: 0,
      volume: 0,
      dealAmount: 0,
      holderFees: 0,
      clientFees: 0,
      serverFees: 0,
      deals: 0,
    },
  );

const getChartDate = (deal: Deal) => {
  const isDateOnlyFallback =
    deal.dealDate.getUTCHours() === 0 &&
    deal.dealDate.getUTCMinutes() === 0 &&
    deal.dealDate.getUTCSeconds() === 0 &&
    deal.dealDate.getUTCMilliseconds() === 0;

  return isDateOnlyFallback ? deal.createdAt : deal.dealDate;
};

const toMoneyTotals = (totals: ReturnType<typeof sumDeals>) => ({
  profit: centsToMoney(totals.profit),
  netProfit: centsToMoney(totals.profit),
  volume: centsToMoney(totals.volume),
  dealAmount: centsToMoney(totals.dealAmount),
  holderFees: centsToMoney(totals.holderFees),
  clientFees: centsToMoney(totals.clientFees),
  serverFees: centsToMoney(totals.serverFees),
  deals: totals.deals,
});

const trend = (current: number, previous: number) => {
  if (previous === 0) {
    return {
      value: current === 0 ? '0.0%' : '100.0%',
      up: current > 0,
    };
  }

  const change = ((current - previous) / Math.abs(previous)) * 100;
  return {
    value: `${Math.abs(change).toFixed(1)}%`,
    up: change >= 0,
  };
};

const buildChartPoints = (range: StatsRange, deals: Deal[], start: Date, end: Date): ChartPoint[] => {
  if (range === '24h') {
    const pointsByLabel = new Map<string, ChartPoint>();

    deals
      .filter((deal) => {
        const chartDate = getChartDate(deal);
        return chartDate >= start && chartDate < end;
      })
      .sort((firstDeal, secondDeal) => getChartDate(firstDeal).getTime() - getChartDate(secondDeal).getTime())
      .forEach((deal) => {
        const label = formatBucketLabel(range, getChartDate(deal));
        const point = pointsByLabel.get(label) ?? { label, profit: 0, volume: 0 };
        point.profit += centsToMoney(getCalculatedProfitCents(deal));
        point.volume += centsToMoney(deal.dealAmount);
        pointsByLabel.set(label, point);
      });

    return Array.from(pointsByLabel.values());
  }

  const bucketStarts = getBucketStarts(range, start, end);

  return bucketStarts.map((bucketStart, index) => {
    const bucketEnd = getBucketEnd(range, bucketStart, index, bucketStarts, end);
    const bucketDeals = deals.filter((deal) => {
      const chartDate = getChartDate(deal);
      return chartDate >= bucketStart && chartDate < bucketEnd;
    });
    const totals = sumDeals(bucketDeals);

    return {
      label: formatBucketLabel(range, bucketStart),
      profit: centsToMoney(totals.profit),
      volume: centsToMoney(totals.volume),
    };
  });
};

export const statsService = {
  async clearCache() {
    await prisma.dashboardCache.deleteMany();
  },

  async getDashboardStats(range: StatsRange): Promise<StatsResponse> {
    const now = new Date();
    const cachedStats = await prisma.dashboardCache.findUnique({
      where: { range },
    });

    if (cachedStats && cachedStats.expiresAt > now) {
      return cachedStats.data as unknown as StatsResponse;
    }

    const { start, end, previousStart, previousEnd } = getRangeWindow(range);

    const [currentDeals, previousDeals, recentDeals] = await Promise.all([
      prisma.deal.findMany({
        where: {
          dealDate: {
            gte: start,
            lt: end,
          },
        },
        orderBy: {
          dealDate: 'desc',
        },
      }),
      prisma.deal.findMany({
        where: {
          dealDate: {
            gte: previousStart,
            lt: previousEnd,
          },
        },
      }),
      prisma.deal.findMany({
        orderBy: {
          dealDate: 'desc',
        },
        take: 5,
      }),
    ]);

    const totals = sumDeals(currentDeals);
    const previousTotals = sumDeals(previousDeals);
    const moneyTotals = toMoneyTotals(totals);
    const previousMoneyTotals = toMoneyTotals(previousTotals);
    const chartPoints = buildChartPoints(range, currentDeals, start, end);

    const stats: StatsResponse = {
      range,
      totals: moneyTotals,
      trends: {
        profit: trend(moneyTotals.profit, previousMoneyTotals.profit),
        netProfit: trend(moneyTotals.netProfit, previousMoneyTotals.netProfit),
      },
      profitOverTime: chartPoints,
      volumeData: chartPoints,
      recentDeals: recentDeals.map(serializeDeal),
    };
    const cacheData = stats as unknown as Prisma.InputJsonValue;

    await prisma.dashboardCache.upsert({
      where: { range },
      create: {
        range,
        data: cacheData,
        computedAt: now,
        expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
      },
      update: {
        data: cacheData,
        computedAt: now,
        expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
      },
    });

    return stats;
  },
};
