import type { DealStatus } from '@prisma/client';

export interface DealResponse {
  id: string;
  dealAmount: number;
  holderFee: number;
  clientFee: number;
  serverFee: number;
  holderUsername: string;
  clientUsername: string | null;
  serverName: string | null;
  profit: number;
  loss: number;
  dealDate: string;
  status: DealStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DealInput {
  dealAmount: number;
  holderFee: number;
  clientFee: number;
  serverFee: number;
  holderUsername: string;
  clientUsername: string;
  serverName: string;
  profit?: number;
  loss?: number;
  dealDate: Date;
  status?: DealStatus;
  notes?: string | null;
}

export interface DealListQuery {
  page: number;
  pageSize: number;
  search?: string;
  status?: DealStatus;
  dateFrom?: Date;
  dateTo?: Date;
  minAmount?: number;
  maxAmount?: number;
}
