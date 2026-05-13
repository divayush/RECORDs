import type { DealResponse } from './deal.model.js';

export type StatsRange = '24h' | 'weekly' | 'monthly' | 'yearly';

export interface ChartPoint {
  label: string;
  profit: number;
  volume: number;
}

export interface StatsResponse {
  range: StatsRange;
  totals: {
    profit: number;
    netProfit: number;
    volume: number;
    dealAmount: number;
    holderFees: number;
    clientFees: number;
    serverFees: number;
    deals: number;
  };
  trends: {
    profit: { value: string; up: boolean };
    netProfit: { value: string; up: boolean };
  };
  profitOverTime: ChartPoint[];
  volumeData: ChartPoint[];
  recentDeals: DealResponse[];
}
