import { useState } from 'react';
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

export default function AddDealPage({ deal, onSaved, onCancel }: AddDealPageProps) {
  const isEditing = Boolean(deal);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    dealAmount: deal ? String(deal.dealAmount) : '',
    holderFee: deal ? String(deal.holderFee) : '',
    clientFee: deal ? String(deal.clientFee) : '',
    holderUsername: deal?.holderUsername ?? '',
    clientUsername: deal?.clientUsername ?? '',
    profit: deal ? String(deal.profit) : '',
    loss: deal ? String(deal.loss) : '',
    dealDate: deal ? toDateInputValue(deal.dealDate) : toDateInputValue(),
    status: deal ? deal.status.toLowerCase() : 'profit',
    notes: deal?.notes ?? '',
  });

  const validateForm = () => {
    const moneyFields = [
      ['Deal Amount', formData.dealAmount],
      ['Holder Fee', formData.holderFee],
      ['Client Fee', formData.clientFee],
      ['Profit', formData.profit || '0'],
      ['Loss', formData.loss || '0'],
    ];

    if (!formData.dealAmount.trim()) return 'Please enter the deal amount.';
    if (!formData.holderFee.trim()) return 'Please enter the holder fee. Use 0 if there is no fee.';
    if (!formData.clientFee.trim()) return 'Please enter the client fee. Use 0 if there is no fee.';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        dealAmount: Number(formData.dealAmount || 0),
        holderFee: Number(formData.holderFee || 0),
        clientFee: Number(formData.clientFee || 0),
        holderUsername: formData.holderUsername,
        clientUsername: formData.clientUsername,
        profit: Number(formData.profit || 0),
        loss: Number(formData.loss || 0),
        dealDate: withCurrentIndiaTime(formData.dealDate),
        status: formData.status,
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
    <div className="flex-1 overflow-auto p-6">
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

          {/* Deal Amount and Fees */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Deal Amount</label>
              <input
                type="number"
                value={formData.dealAmount}
                onChange={(e) => handleChange('dealAmount', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Holder Fee</label>
              <input
                type="number"
                value={formData.holderFee}
                onChange={(e) => handleChange('holderFee', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Client Fee</label>
              <input
                type="number"
                value={formData.clientFee}
                onChange={(e) => handleChange('clientFee', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Usernames */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Holder Username</label>
              <input
                type="text"
                value={formData.holderUsername}
                onChange={(e) => handleChange('holderUsername', e.target.value)}
                placeholder="Enter holder username"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Client Username</label>
              <input
                type="text"
                value={formData.clientUsername}
                onChange={(e) => handleChange('clientUsername', e.target.value)}
                placeholder="Enter client username"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Profit and Loss */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Profit in $</label>
              <input
                type="number"
                value={formData.profit}
                onChange={(e) => handleChange('profit', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Loss in $</label>
              <input
                type="number"
                value={formData.loss}
                onChange={(e) => handleChange('loss', e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          {/* Date and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm mb-2">Deal Date</label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dealDate}
                  onChange={(e) => handleChange('dealDate', e.target.value)}
                  className="date-input-clean w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="profit">Profit</option>
                <option value="loss">Loss</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="mb-6">
            <label className="block text-sm mb-2">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add any additional notes about this deal..."
              rows={4}
              className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : isEditing ? 'Update Deal' : 'Save Deal'}</span>
            </button>

            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 px-6 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="mt-6 bg-card border border-border rounded-lg p-6">
          <h3 className="text-foreground mb-4">Deal Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Fees</p>
              <p className="text-foreground">
                ${(Number(formData.holderFee || 0) + Number(formData.clientFee || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Net Result</p>
              <p className={`${Number(formData.profit || 0) - Number(formData.loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${(Number(formData.profit || 0) - Number(formData.loss || 0)).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Total Volume</p>
              <p className="text-foreground">
                ${Number(formData.dealAmount || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Status</p>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs ${
                  formData.status === 'profit'
                    ? 'bg-green-500/10 text-green-500'
                    : formData.status === 'loss'
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-yellow-500/10 text-yellow-500'
                }`}
              >
                {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
