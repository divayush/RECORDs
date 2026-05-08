export type TimeRange = '24h' | 'weekly' | 'monthly' | 'yearly';
export type DealStatus = 'PROFIT' | 'LOSS' | 'PENDING';

export interface Deal {
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

export interface StatsResponse {
  range: TimeRange;
  totals: {
    profit: number;
    loss: number;
    netProfit: number;
    volume: number;
    dealAmount: number;
    holderFees: number;
    clientFees: number;
    deals: number;
  };
  trends: {
    profit: { value: string; up: boolean };
    loss: { value: string; up: boolean };
    netProfit: { value: string; up: boolean };
  };
  profitOverTime: { label: string; profit: number; volume: number }[];
  volumeData: { label: string; profit: number; volume: number }[];
  recentDeals: Deal[];
}

export interface DealPayload {
  dealAmount: number;
  holderFee: number;
  clientFee: number;
  holderUsername: string;
  clientUsername: string;
  profit: number;
  loss: number;
  dealDate: string;
  status: string;
  notes: string | null;
}

export interface DealListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DealStatus | 'all';
  dateFrom?: string;
  dateTo?: string;
  minAmount?: string;
  maxAmount?: string;
}

export interface DealListResponse {
  data: Deal[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? (import.meta.env.PROD ? '' : 'http://127.0.0.1:4000');

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const token = window.localStorage.getItem('deal-ledger-auth-token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: 'Request failed.' }));
    throw new Error(errorBody.error ?? 'Request failed.');
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};

export const api = {
  login: async (username: string, password: string) => {
    const response = await request<{ data: { token: string } }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.data;
  },

  getStats: async (range: TimeRange) => {
    const response = await request<{ data: StatsResponse }>(`/api/stats?range=${range}`);
    return response.data;
  },

  getDeals: async (params: DealListParams = {}) => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        searchParams.set(key, String(value));
      }
    });

    const query = searchParams.toString();
    return request<DealListResponse>(`/api/deals${query ? `?${query}` : ''}`);
  },

  getAllDeals: async () => {
    const firstPage = await api.getDeals({ page: 1, pageSize: 100 });
    const allDeals = [...firstPage.data];

    for (let page = 2; page <= firstPage.meta.totalPages; page += 1) {
      const nextPage = await api.getDeals({ page, pageSize: 100 });
      allDeals.push(...nextPage.data);
    }

    return allDeals;
  },

  createDeal: async (payload: DealPayload) => {
    const response = await request<{ data: Deal }>('/api/deals', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  updateDeal: async (id: string, payload: DealPayload) => {
    const response = await request<{ data: Deal }>(`/api/deals?id=${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return response.data;
  },

  deleteDeal: async (id: string) => {
    await request<void>(`/api/deals?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
