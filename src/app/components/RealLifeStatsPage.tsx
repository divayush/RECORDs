import { useEffect, useState } from 'react';
import { Search, Trash2, Wallet, ReceiptText, Tags } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import KPICard from './KPICard';
import { api, type Spending, type SpendingStatsResponse } from '../lib/api';

const emptyStats: SpendingStatsResponse = {
  totals: {
    spent: 0,
    records: 0,
  },
  byPurpose: [],
  recentSpendings: [],
};

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

export default function RealLifeStatsPage() {
  const [stats, setStats] = useState<SpendingStatsResponse>(emptyStats);
  const [spendings, setSpendings] = useState<Spending[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [statsResponse, spendingsResponse] = await Promise.all([
        api.getSpendingStats(),
        api.getSpendings({ page: 1, pageSize: 25, search }),
      ]);
      setStats(statsResponse);
      setSpendings(spendingsResponse.data);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load spending records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [search]);

  const handleDelete = async (spending: Spending) => {
    setError('');

    try {
      await api.deleteSpending(spending.id);
      await loadData();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete spending record.');
    }
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-foreground mb-1">In Real Life Stats</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading spending records...' : 'Track personal payments separately from deals'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <KPICard title="Total Sent" value={formatCurrency(stats.totals.spent)} icon={Wallet} color="blue" />
        <KPICard title="Records" value={stats.totals.records.toLocaleString()} icon={ReceiptText} color="cyan" />
        <KPICard title="Top Categories" value={stats.byPurpose.length.toLocaleString()} icon={Tags} color="purple" />
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <h3 className="text-foreground mb-3">Spending by Purpose</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={stats.byPurpose} margin={{ top: 6, right: 18, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
              contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
              formatter={(value: number) => formatCurrency(value)}
            />
            <Bar dataKey="amount" fill="#3b82f6" maxBarSize={72} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by person, reason, or notes..."
            className="w-full rounded-lg border border-border bg-input-background py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">Date</th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">Sent To</th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">For What</th>
                <th className="px-4 py-3 text-right text-sm text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left text-sm text-muted-foreground">Notes</th>
                <th className="px-4 py-3 text-center text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {spendings.map((spending) => (
                <tr key={spending.id} className="border-t border-border hover:bg-muted/30">
                  <td className="px-4 py-3 text-sm">{formatDate(spending.spentAt)}</td>
                  <td className="px-4 py-3 text-sm">{spending.sentTo}</td>
                  <td className="px-4 py-3 text-sm">{spending.forWhat}</td>
                  <td className="px-4 py-3 text-right text-sm text-blue-400">{formatCurrency(spending.sentWhat)}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{spending.notes ?? '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => void handleDelete(spending)}
                      className="rounded p-1.5 transition-colors hover:bg-muted"
                    >
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && spendings.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No spending records yet. Add one from the submit page.</p>
          </div>
        )}
      </div>
    </div>
  );
}
