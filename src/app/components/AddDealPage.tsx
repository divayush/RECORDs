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
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    dealAmount: deal ? String(deal.dealAmount) : '',
    clientFee: deal ? String(deal.clientFee) : '',
    holderFee: deal ? String(deal.holderFee) : '',
    serverName: deal?.serverName ?? '',
    serverFee: deal ? String(deal.serverFee) : '',
    holderUsername: deal?.holderUsername ?? '',
    dealDate: deal ? toDateInputValue(deal.dealDate) : toDateInputValue(),
    notes: deal?.notes ?? '',
  });

  const calculatedProfit = useMemo(
    () =>
      toNumber(formData.dealAmount) -
      toNumber(formData.clientFee) -
      toNumber(formData.serverFee) -
      toNumber(formData.holderFee),
    [formData.clientFee, formData.dealAmount, formData.holderFee, formData.serverFee],
  );

  const validateForm = () => {
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
      const payload = {
        dealAmount: toNumber(formData.dealAmount),
        clientFee: toNumber(formData.clientFee),
        holderFee: toNumber(formData.holderFee),
        serverName: formData.serverName.trim(),
        serverFee: toNumber(formData.serverFee),
        holderUsername: formData.holderUsername.trim(),
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

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6">
      <div className="max-w-3xl mx-auto mb-6">
        <h2 className="text-foreground mb-1">{isEditing ? 'Edit Deal' : 'Add New Deal'}</h2>
        <p className="text-sm text-muted-foreground">
          {isEditing ? 'Update the details of this deal' : 'Enter the details of the new deal'}
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="max-w-3xl mx-auto">
        <div className="bg-card border border-border rounded-lg p-6">
          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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

          <div className="grid grid-cols-1 gap-3 sm:flex">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Deal' : 'Save Deal'}</span>
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
      </form>
    </div>
  );
}
