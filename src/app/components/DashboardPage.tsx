import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, BarChart3, FileText, Users, Wallet } from 'lucide-react';
import KPICard from './KPICard';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { api, type Deal, type StatsResponse, type TimeRange } from '../lib/api';

const timeRangeOptions: { id: TimeRange; label: string }[] = [
  { id: '24h', label: '24 Hours' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'yearly', label: 'Yearly' },
];

const emptyStats: StatsResponse = {
  range: 'yearly',
  totals: {
    profit: 0,
    loss: 0,
    netProfit: 0,
    volume: 0,
    dealAmount: 0,
    holderFees: 0,
    clientFees: 0,
    deals: 0,
  },
  trends: {
    profit: { value: '0.0%', up: false },
    loss: { value: '0.0%', up: false },
    netProfit: { value: '0.0%', up: false },
  },
  profitOverTime: [],
  volumeData: [],
  recentDeals: [],
};

const COLORS = {
  profit: '#10b981',
  loss: '#ef4444',
  blue: '#3b82f6',
  purple: '#a855f7',
  cyan: '#06b6d4',
  muted: '#262626',
};

const formatCurrency = (value: number) => {
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }

  return `$${value.toLocaleString()}`;
};

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatStatus = (status: Deal['status']) => status.charAt(0) + status.slice(1).toLowerCase();

type PieTooltipProps = {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
  }>;
};

function DarkPieTooltip({ active, payload }: PieTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload.find((entry) => Number(entry.value) > 0);
  if (!item || !item.value) return null;

  return (
    <div className="rounded-lg border border-border bg-[#1a1a1a] px-3 py-2 text-sm text-foreground shadow-xl">
      {item.name}: ${item.value.toLocaleString()}
    </div>
  );
}

export default function DashboardPage() {
  const [activeRange, setActiveRange] = useState<TimeRange>('yearly');
  const [stats, setStats] = useState<StatsResponse>(emptyStats);
  const [selectedVolumePoint, setSelectedVolumePoint] = useState<{ label: string; volume: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isCurrent = true;

    setIsLoading(true);
    setError('');
    setSelectedVolumePoint(null);

    api
      .getStats(activeRange)
      .then((data) => {
        if (isCurrent) setStats(data);
      })
      .catch((requestError: Error) => {
        if (isCurrent) setError(requestError.message);
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [activeRange]);

  const pieTotal = stats.totals.profit + stats.totals.loss;
  const pieData =
    pieTotal > 0
      ? [
          { name: 'Profit', value: stats.totals.profit },
          { name: 'Loss', value: stats.totals.loss },
        ]
      : [{ name: 'No Data', value: 1 }];
  const feeTotal = stats.totals.holderFees + stats.totals.clientFees + stats.totals.netProfit;
  const feeBreakdownData =
    feeTotal > 0
      ? [
          { name: 'Holder Fee', value: stats.totals.holderFees },
          { name: 'Client Fee', value: stats.totals.clientFees },
          { name: 'Net Profit', value: Math.max(stats.totals.netProfit, 0) },
        ].filter((item) => item.value > 0)
      : [{ name: 'No Data', value: 1 }];

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-foreground mb-1">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground">
            {isLoading ? 'Loading live deal analytics...' : 'Your deal analytics at a glance'}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 rounded-lg border border-border bg-input-background p-1 sm:flex sm:w-fit">
          {timeRangeOptions.map((option) => {
            const isActive = activeRange === option.id;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setActiveRange(option.id)}
                className={`px-3 py-2 rounded-md text-sm transition-colors sm:px-4 ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          title="Total Profit"
          value={formatCurrency(stats.totals.profit)}
          icon={TrendingUp}
          color="green"
        />
        <KPICard
          title="Total Loss"
          value={formatCurrency(stats.totals.loss)}
          icon={TrendingDown}
          color="red"
        />
        <KPICard
          title="Net Profit"
          value={formatCurrency(stats.totals.netProfit)}
          icon={DollarSign}
          color="blue"
        />
        <KPICard
          title="Total Volume"
          value={formatCurrency(stats.totals.volume)}
          icon={BarChart3}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard title="Total Deal Amount" value={formatCurrency(stats.totals.dealAmount)} icon={Wallet} color="cyan" />
        <KPICard title="Total Holder Fees" value={formatCurrency(stats.totals.holderFees)} icon={Users} color="purple" />
        <KPICard title="Total Client Fees" value={formatCurrency(stats.totals.clientFees)} icon={FileText} color="cyan" />
        <KPICard title="Number of Deals" value={stats.totals.deals.toLocaleString()} icon={FileText} color="default" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-card border border-border rounded-lg p-4 md:p-5">
          <h3 className="text-foreground mb-4">Profit vs Loss</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 18, right: 18, bottom: 8, left: 18 }}>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => (pieTotal > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : 'No Data')}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {pieData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}`}
                    fill={pieTotal === 0 ? COLORS.muted : index === 0 ? COLORS.profit : COLORS.loss}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4 md:p-5">
          <h3 className="text-foreground mb-4">Fee Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart margin={{ top: 18, right: 18, bottom: 8, left: 18 }}>
              <Pie
                data={feeBreakdownData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={feeTotal > 0 ? 5 : 0}
                dataKey="value"
                label={({ name }) => name}
                stroke="#ffffff"
                strokeWidth={2}
              >
                {feeBreakdownData.map((entry) => (
                  <Cell
                    key={`fee-${entry.name}`}
                    fill={
                      feeTotal === 0
                        ? COLORS.muted
                        : entry.name === 'Holder Fee'
                          ? COLORS.purple
                          : entry.name === 'Client Fee'
                            ? COLORS.cyan
                            : COLORS.blue
                    }
                  />
                ))}
              </Pie>
              {feeTotal > 0 && <Tooltip content={<DarkPieTooltip />} />}
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <h3 className="text-foreground mb-3">Profit Over Time</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={stats.profitOverTime} margin={{ top: 6, right: 18, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: number) => `$${value.toLocaleString()}`}
              />
              <Line type="monotone" dataKey="profit" stroke={COLORS.profit} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <h3 className="text-foreground">Deal Volume</h3>
            {selectedVolumePoint && (
              <p className="text-sm text-blue-400">
                {selectedVolumePoint.label}: {formatCurrency(selectedVolumePoint.volume)}
              </p>
            )}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={stats.volumeData} barCategoryGap="45%" margin={{ top: 6, right: 18, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="label" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.04)' }}
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar
                dataKey="volume"
                fill={COLORS.blue}
                maxBarSize={72}
                onClick={(entry) => setSelectedVolumePoint({ label: entry.label, volume: entry.volume })}
                className="cursor-pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg p-5">
        <h3 className="text-foreground mb-4">Recent Deals</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Date</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Holder</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Client</th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">Amount</th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">Profit</th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">Loss</th>
                <th className="text-center py-3 px-4 text-sm text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentDeals.map((deal) => (
                <tr key={deal.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-4 text-sm">{formatDate(deal.dealDate)}</td>
                  <td className="py-3 px-4 text-sm">{deal.holderUsername}</td>
                  <td className="py-3 px-4 text-sm">{deal.clientUsername}</td>
                  <td className="py-3 px-4 text-sm text-right">${deal.dealAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-green-500">
                    {deal.profit > 0 ? `$${deal.profit.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-red-500">
                    {deal.loss > 0 ? `$${deal.loss.toLocaleString()}` : '-'}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs ${
                        deal.status === 'PROFIT'
                          ? 'bg-green-500/10 text-green-500'
                          : deal.status === 'LOSS'
                            ? 'bg-red-500/10 text-red-500'
                            : 'bg-yellow-500/10 text-yellow-500'
                      }`}
                    >
                      {formatStatus(deal.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!isLoading && stats.recentDeals.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No deals yet. Add your first deal to populate the dashboard.</p>
          </div>
        )}
      </div>
    </div>
  );
}
