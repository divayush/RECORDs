import type { DealStatus } from '@prisma/client';

export interface DealResponse {
  id: string;
  dealAmount: number;
  holderFee: number;
  clientFee: number;
  holderUsername: string;
  clientUsername: string;
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
  holderUsername: string;
  clientUsername: string;
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
