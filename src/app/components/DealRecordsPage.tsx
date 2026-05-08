import { Search, Filter, Edit, Trash2, ArrowUpDown, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, type Deal } from '../lib/api';

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

const formatStatus = (status: Deal['status']) => status.charAt(0) + status.slice(1).toLowerCase();

interface DealRecordsPageProps {
  onEditDeal: (deal: Deal) => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function DealRecordsPage({ onEditDeal, searchTerm, onSearchChange }: DealRecordsPageProps) {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'PROFIT' | 'LOSS' | 'PENDING'>('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [page, setPage] = useState(1);
  const [totalDeals, setTotalDeals] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dealToDelete, setDealToDelete] = useState<Deal | null>(null);
  const [error, setError] = useState('');

  const loadDeals = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await api.getDeals({
        page,
        pageSize: 25,
        search: searchTerm,
        status: statusFilter,
        dateFrom,
        dateTo,
        minAmount,
        maxAmount,
      });
      setDeals(response.data);
      setTotalDeals(response.meta.total);
      setTotalPages(response.meta.totalPages);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load deals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDeals();
  }, [page, searchTerm, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, dateFrom, dateTo, minAmount, maxAmount]);

  const handleDelete = (deal: Deal) => {
    setDealToDelete(deal);
  };

  const confirmDelete = async () => {
    if (!dealToDelete) return;
    setIsDeleting(true);
    setError('');

    try {
      await api.deleteDeal(dealToDelete.id);
      setDeals((currentDeals) => currentDeals.filter((deal) => deal.id !== dealToDelete.id));
      setTotalDeals((currentTotal) => Math.max(0, currentTotal - 1));
      setDealToDelete(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to delete deal.');
    } finally {
      setIsDeleting(false);
    }
  };

  const clearMoreFilters = () => {
    setDateFrom('');
    setDateTo('');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasMoreFilters = Boolean(dateFrom || dateTo || minAmount || maxAmount);

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-foreground mb-1">Deal Records</h2>
        <p className="text-sm text-muted-foreground">
          {isLoading ? 'Loading saved deals...' : 'View and manage all your deals'}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by holder, client, or notes..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'PROFIT' | 'LOSS' | 'PENDING')}
          className="px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="all">All Status</option>
          <option value="PROFIT">Profit</option>
          <option value="LOSS">Loss</option>
          <option value="PENDING">Pending</option>
        </select>

        <button
          type="button"
          onClick={() => setShowMoreFilters((current) => !current)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            showMoreFilters || hasMoreFilters
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span>More Filters</span>
        </button>
      </div>

      {showMoreFilters && (
        <div className="mb-6 rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
                className="date-input-clean w-full rounded-lg border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
                className="date-input-clean w-full rounded-lg border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Min Amount</label>
              <input
                type="number"
                min="0"
                value={minAmount}
                onChange={(event) => setMinAmount(event.target.value)}
                placeholder="0"
                className="w-full rounded-lg border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Max Amount</label>
              <input
                type="number"
                min="0"
                value={maxAmount}
                onChange={(event) => setMaxAmount(event.target.value)}
                placeholder="Any"
                className="w-full rounded-lg border border-border bg-input-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {hasMoreFilters ? 'Extra filters are active.' : 'Filter records by date or deal amount.'}
            </p>
            <button
              type="button"
              onClick={clearMoreFilters}
              disabled={!hasMoreFilters}
              className="rounded-lg bg-secondary px-4 py-2 text-sm text-secondary-foreground transition-colors hover:bg-secondary/80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground">
                    Date <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Holder Username</th>
                <th className="text-left py-3 px-4 text-sm text-muted-foreground">Client Username</th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground ml-auto">
                    Deal Amount <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">Holder Fee</th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">Client Fee</th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground ml-auto">
                    Profit <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">
                  <button className="flex items-center gap-1 hover:text-foreground ml-auto">
                    Loss <ArrowUpDown className="w-3 h-3" />
                  </button>
                </th>
                <th className="text-right py-3 px-4 text-sm text-muted-foreground">Net Result</th>
                <th className="text-center py-3 px-4 text-sm text-muted-foreground">Status</th>
                <th className="text-center py-3 px-4 text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal) => {
                const netResult = deal.profit - deal.loss;
                return (
                  <tr key={deal.id} className="border-t border-border hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-4 text-sm">{formatDate(deal.dealDate)}</td>
                    <td className="py-3 px-4 text-sm">{deal.holderUsername}</td>
                    <td className="py-3 px-4 text-sm">{deal.clientUsername}</td>
                    <td className="py-3 px-4 text-sm text-right">${deal.dealAmount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-purple-400">${deal.holderFee.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-cyan-400">${deal.clientFee.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-green-500">
                      {deal.profit > 0 ? `$${deal.profit.toLocaleString()}` : '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-red-500">
                      {deal.loss > 0 ? `$${deal.loss.toLocaleString()}` : '-'}
                    </td>
                    <td className={`py-3 px-4 text-sm text-right ${netResult >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      ${netResult.toLocaleString()}
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
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditDeal(deal)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(deal)}
                          className="p-1.5 hover:bg-muted rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && deals.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-muted-foreground">No deals found matching your filters.</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {deals.length} of {totalDeals} deals, page {page} of {totalPages}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || isLoading}
            onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <button
            type="button"
            disabled={page >= totalPages || isLoading}
            onClick={() => setPage((currentPage) => Math.min(totalPages, currentPage + 1))}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {dealToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-foreground">Delete Deal</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will permanently remove the deal between {dealToDelete.holderUsername} and {dealToDelete.clientUsername}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-5 rounded-lg border border-border bg-background/60 p-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Deal Amount</span>
                <span className="text-foreground">${dealToDelete.dealAmount.toLocaleString()}</span>
              </div>
              <div className="mt-2 flex justify-between gap-4">
                <span className="text-muted-foreground">Date</span>
                <span className="text-foreground">{formatDate(dealToDelete.dealDate)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDealToDelete(null)}
                className="rounded-lg bg-secondary px-4 py-2 text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => void confirmDelete()}
                className="rounded-lg bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? 'Deleting...' : 'Delete Deal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
