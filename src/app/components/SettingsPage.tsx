import { useState } from 'react';
import { Database, Globe, Download } from 'lucide-react';
import type { UserProfile } from '../App';
import { api, type Deal } from '../lib/api';

interface SettingsPageProps {
  profile: UserProfile;
  onLogout: () => void;
  onSaveProfile: (profile: UserProfile) => void;
}

export default function SettingsPage({ profile, onLogout, onSaveProfile }: SettingsPageProps) {
  const [formData, setFormData] = useState(profile);
  const [savedMessage, setSavedMessage] = useState('');
  const [exportMessage, setExportMessage] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const downloadFile = (fileName: string, content: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const csvValue = (value: string | number | null) => {
    const text = value === null ? '' : String(value);
    return `"${text.replaceAll('"', '""')}"`;
  };

  const dealsToCsv = (deals: Deal[]) => {
    const headers = [
      'Date',
      'Holder Username',
      'Client Username',
      'Deal Amount',
      'Holder Fee',
      'Client Fee',
      'Profit',
      'Loss',
      'Status',
      'Notes',
      'Created At',
      'Updated At',
    ];

    const rows = deals.map((deal) => [
      deal.dealDate,
      deal.holderUsername,
      deal.clientUsername,
      deal.dealAmount,
      deal.holderFee,
      deal.clientFee,
      deal.profit,
      deal.loss,
      deal.status,
      deal.notes,
      deal.createdAt,
      deal.updatedAt,
    ]);

    return [headers, ...rows].map((row) => row.map(csvValue).join(',')).join('\n');
  };

  const handleExport = async (format: 'json' | 'csv') => {
    setIsExporting(true);
    setExportMessage('');

    try {
      const deals = await api.getAllDeals();
      const dateStamp = new Date().toISOString().slice(0, 10);

      if (format === 'json') {
        downloadFile(
          `deal-ledger-export-${dateStamp}.json`,
          JSON.stringify({ exportedAt: new Date().toISOString(), profile: formData, deals }, null, 2),
          'application/json',
        );
        setExportMessage('All data exported successfully.');
      } else {
        downloadFile(`deal-ledger-deals-${dateStamp}.csv`, dealsToCsv(deals), 'text/csv;charset=utf-8');
        setExportMessage('Deals CSV exported successfully.');
      }

      window.setTimeout(() => setExportMessage(''), 3000);
    } catch (requestError) {
      setExportMessage(requestError instanceof Error ? requestError.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSave = () => {
    const nextProfile = {
      fullName: formData.fullName.trim() || 'User',
      email: formData.email.trim(),
    };

    setFormData(nextProfile);
    onSaveProfile(nextProfile);
    setSavedMessage('Settings saved successfully.');
    window.setTimeout(() => setSavedMessage(''), 3000);
  };

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mb-6">
        <h2 className="text-foreground mb-1">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your application preferences</p>
      </div>

      <div className="max-w-4xl space-y-6">
        {/* Profile Settings */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-foreground">Profile Settings</h3>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(event) => setFormData((current) => ({ ...current, fullName: event.target.value }))}
                  className="w-full px-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Data & Export */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <h3 className="text-foreground">Data & Export</h3>
              <p className="text-sm text-muted-foreground">Manage your data and exports</p>
            </div>
          </div>

          <div className="space-y-3">
            {exportMessage && (
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-400">
                {exportMessage}
              </div>
            )}
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport('json')}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-left">
                <p className="text-sm text-foreground">Export All Data</p>
                <p className="text-xs text-muted-foreground">Download a complete copy of your data</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => void handleExport('csv')}
              className="w-full flex items-center justify-between px-4 py-3 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="text-left">
                <p className="text-sm text-foreground">Export Deals (CSV)</p>
                <p className="text-xs text-muted-foreground">Export deal records in CSV format</p>
              </div>
              <Download className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg bg-red-500/10 px-6 py-2 text-red-400 transition-colors hover:bg-red-500/20"
          >
            Logout
          </button>

          <div className="flex items-center gap-4">
            {savedMessage && <p className="text-sm text-green-500">{savedMessage}</p>}
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
