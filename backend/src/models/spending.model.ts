export interface SpendingResponse {
  id: string;
  sentTo: string;
  forWhat: string;
  sentWhat: number;
  notes: string | null;
  spentAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface SpendingInput {
  sentTo: string;
  forWhat: string;
  sentWhat: number;
  notes?: string | null;
  spentAt: Date;
}

export interface SpendingListQuery {
  page: number;
  pageSize: number;
  search?: string;
}

export interface SpendingStatsResponse {
  totals: {
    spent: number;
    records: number;
  };
  byPurpose: { name: string; amount: number }[];
  recentSpendings: SpendingResponse[];
}
