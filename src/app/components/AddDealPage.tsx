import { useMemo, useState } from 'react';
import { Calendar, Save, X } from 'lucide-react';
import { api, type Deal } from '../lib/api';

interface AddDealPageProps {
  deal?: Deal | null;
  onSaved?: (message: string) => void;
  onCancel: () => void;
}

const INDIA_TIME_ZONE = 'Asia/Kolkata';

const getIndiaDateParts = (date: Date) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: INDIA_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;

const toDateInputValue = (value: string | Date = new Date()) => {
  const parts = getIndiaDateParts(new Date(value));
  return `${parts.year}-${parts.month}-${parts.day}`;
};

const withCurrentIndiaTime = (dateValue: string) => {
  const parts = getIndiaDateParts(new Date());
  const milliseconds = String(new Date().getMilliseconds()).padStart(3, '0');
  return `${dateValue}T${parts.hour}:${parts.minute}:${parts.second}.${milliseconds}+05:30`;
};

const toNumber = (value: string) => Number(value || 0);

export default function AddDealPage({ deal, onSaved, onCancel }: AddDealPageProps) {
  const isEditing = Boolean(deal);
  const [mode, setMode] = useState<'main' | 'life'>(deal ? 'main' : 'main');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    dealAmount: deal ? String(deal.dealAmount) : '',
    clientFee: deal ? String(deal.clientFee) : '',
    holderFee: deal ? String(deal.holderFee) : '',
    serverName: deal?.serverName ?? '',
    serverFee: deal ? String(deal.serverFee) : '',
    holderUsername: deal?.holderUsername ?? '',
    clientUsername: deal?.clientUsername ?? '',
    dealDate: deal ? toDateInputValue(deal.dealDate) : toDateInputValue(),
    notes: deal?.notes ?? '',
  });
  const [spendingData, setSpendingData] = useState({
    sentTo: '',
    forWhat: '',
    sentWhat: '',
    spentAt: toDateInputValue(),
    notes: '',
  });

  const calculatedProfit = useMemo(
    () => toNumber(formData.clientFee) - (toNumber(formData.holderFee) + toNumber(formData.serverFee)),
    [formData.clientFee, formData.holderFee, formData.serverFee],
  );

  const validateForm = () => {
    if (mode === 'life') {
      if (!spendingData.sentTo.trim()) return 'Please enter who you sent it to.';
      if (!spendingData.forWhat.trim()) return 'Please enter what it was for.';
      if (!spendingData.sentWhat.trim()) return 'Please enter what amount was sent.';
      if (!spendingData.spentAt) return 'Please select the spending date.';

      const amount = Number(spendingData.sentWhat);
      if (Number.isNaN(amount) || amount < 0) return 'Sent what must be a valid number of 0 or more.';

      return '';
    }

    const moneyFields = [
      ['Deal Amount', formData.dealAmount],
      ['Client Fee', formData.clientFee],
      ['Holder Fee', formData.holderFee],
      ['Server Fee', formData.serverFee],
    ];

    if (!formData.dealAmount.trim()) return 'Please enter the deal amount.';
    if (!formData.clientFee.trim()) return 'Please enter the client fee. Use 0 if there is no fee.';
    if (!formData.holderFee.trim()) return 'Please enter the holder fee. Use 0 if there is no fee.';
    if (!formData.serverName.trim()) return 'Please enter where the deal happened.';
    if (!formData.serverFee.trim()) return 'Please enter the server fee. Use 0 if there is no fee.';
    if (!formData.holderUsername.trim()) return 'Please enter the holder username.';
    if (!formData.clientUsername.trim()) return 'Please enter the client username.';
    if (!formData.dealDate) return 'Please select the deal date.';

    for (const [label, value] of moneyFields) {
      const amount = Number(value);
      if (Number.isNaN(amount) || amount < 0) {
        return `${label} must be a valid number of 0 or more.`;
      }
    }

    return '';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      if (mode === 'life') {
        await api.createSpending({
          sentTo: spendingData.sentTo.trim(),
          forWhat: spendingData.forWhat.trim(),
          sentWhat: toNumber(spendingData.sentWhat),
          spentAt: withCurrentIndiaTime(spendingData.spentAt),
          notes: spendingData.notes.trim() || null,
        });

        if (onSaved) {
          onSaved('Spending record saved successfully.');
        } else {
          onCancel();
        }

        return;
      }

      const payload = {
        dealAmount: toNumber(formData.dealAmount),
        clientFee: toNumber(formData.clientFee),
        holderFee: toNumber(formData.holderFee),
        serverName: formData.serverName.trim(),
        serverFee: toNumber(formData.serverFee),
        holderUsername: formData.holderUsername.trim(),
        clientUsername: formData.clientUsername.trim(),
        dealDate: withCurrentIndiaTime(formData.dealDate),
        notes: formData.notes.trim() || null,
      };

      if (deal) {
        await api.updateDeal(deal.id, payload);
      } else {
        await api.createDeal(payload);
      }

      if (onSaved) {
        onSaved(isEditing ? 'Deal updated successfully.' : 'Deal saved successfully.');
      } else {
        onCancel();
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to save deal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSpendingChange = (field: string, value: string) => {
    setSpendingData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto mb-6">
        <h2 className="text-foreground mb-1">{isEditing ? 'Edit Deal' : 'Add New Deal'}</h2>
        <p className="text-sm text-muted-foreground">
          {isEditing ? 'Update the details of this deal' : 'Enter the details of the new deal'}
        </p>
      </div>

      <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-[180px_1fr]">
        <div className="h-fit rounded-lg border border-border bg-card p-3">
          <button
            type="button"
            disabled={isEditing}
            onClick={() => setMode('main')}
            className={`mb-2 w-full rounded-lg px-4 py-3 text-left text-sm transition-colors ${
              mode === 'main'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            Main Page
          </button>
          <button
            type="button"
            disabled={isEditing}
            onClick={() => setMode('life')}
            className={`w-full rounded-lg px-4 py-3 text-left text-sm transition-colors ${
              mode === 'life'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            } disabled:cursor-not-allowed disabled:opacity-70`}
          >
            In Real Life
          </button>
        </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {mode === 'life' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm mb-2">Sent To Whom</label>
                  <input
                    type="text"
                    value={spendingData.sentTo}
                    onChange={(event) => handleSpendingChange('sentTo', event.target.value)}
                    placeholder="Enter name or username"
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">For What</label>
                  <input
                    type="text"
                    value={spendingData.forWhat}
                    onChange={(event) => handleSpendingChange('forWhat', event.target.value)}
                    placeholder="Food, travel, rent..."
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm mb-2">Amount</label>
                  <input
                    type="number"
                    value={spendingData.sentWhat}
                    onChange={(event) => handleSpendingChange('sentWhat', event.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="block text-sm mb-2">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      value={spendingData.spentAt}
                      onChange={(event) => handleSpendingChange('spentAt', event.target.value)}
                      className="date-input-clean w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm mb-2">Notes</label>
                <textarea
                  value={spendingData.notes}
                  onChange={(event) => handleSpendingChange('notes', event.target.value)}
                  placeholder="Add any notes about this spending..."
                  rows={4}
                  className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            </>
          ) : (
            <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Deal Amount</label>
              <input
                type="number"
                value={formData.dealAmount}
                onChange={(event) => handleChange('dealAmount', event.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Client Fee</label>
              <input
                type="number"
                value={formData.clientFee}
                onChange={(event) => handleChange('clientFee', event.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Holder Fee</label>
              <input
                type="number"
                value={formData.holderFee}
                onChange={(event) => handleChange('holderFee', event.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Server</label>
              <input
                type="text"
                value={formData.serverName}
                onChange={(event) => handleChange('serverName', event.target.value)}
                placeholder="Enter server name"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Server Fee</label>
              <input
                type="number"
                value={formData.serverFee}
                onChange={(event) => handleChange('serverFee', event.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Holder Username</label>
              <input
                type="text"
                value={formData.holderUsername}
                onChange={(event) => handleChange('holderUsername', event.target.value)}
                placeholder="Enter holder username"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Client Username</label>
              <input
                type="text"
                value={formData.clientUsername}
                onChange={(event) => handleChange('clientUsername', event.target.value)}
                placeholder="Enter client username"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Deal Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dealDate}
                  onChange={(event) => handleChange('dealDate', event.target.value)}
                  className="date-input-clean w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Profit in $</label>
              <input
                type="text"
                value={`$${calculatedProfit.toLocaleString()}`}
                readOnly
                className={`w-full px-4 py-2 rounded-lg border border-border focus:outline-none ${
                  calculatedProfit >= 0
                    ? 'bg-green-500/10 text-green-400'
                    : 'bg-red-500/10 text-red-400'
                }`}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              placeholder="Add any additional notes about this deal..."
              rows={4}
              className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-3 sm:flex">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Deal' : mode === 'life' ? 'Save Spending' : 'Save Deal'}</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {mode === 'main' && (
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h3 className="text-foreground mb-4">Deal Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
              <p className="text-foreground">
                ${(toNumber(formData.clientFee) + toNumber(formData.holderFee) + toNumber(formData.serverFee)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">After Fees</p>
              <p className="text-foreground">${calculatedProfit.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Profit</p>
              <p className={calculatedProfit >= 0 ? 'text-green-500' : 'text-red-500'}>
                ${calculatedProfit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="text-foreground">${toNumber(formData.dealAmount).toLocaleString()}</p>
            </div>
          </div>
        </div>
        )}
      </form>
      </div>
    </div>
  );
}
