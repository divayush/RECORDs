import { useState } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPage from './components/DashboardPage';
import DealRecordsPage from './components/DealRecordsPage';
import AddDealPage from './components/AddDealPage';
import SettingsPage from './components/SettingsPage';
import LoginPage from './components/LoginPage';
import type { Deal } from './lib/api';

export interface UserProfile {
  fullName: string;
  email: string;
}

const defaultProfile: UserProfile = {
  fullName: 'Ayush',
  email: 'Lite@convert.discord',
};

const getSavedProfile = () => {
  const savedProfile = window.localStorage.getItem('deal-ledger-profile');
  if (!savedProfile) return defaultProfile;

  try {
    return { ...defaultProfile, ...JSON.parse(savedProfile) } as UserProfile;
  } catch {
    return defaultProfile;
  }
};

export default function App() {
  const [activePage, setActivePage] = useState('dashboard');
  const [searchValue, setSearchValue] = useState('');
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [profile, setProfile] = useState<UserProfile>(getSavedProfile);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(window.localStorage.getItem('deal-ledger-auth-token')));
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (message: string) => {
    setToastMessage(message);
    window.setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddDeal = () => {
    setEditingDeal(null);
    setActivePage('add-deal');
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
    setActivePage('add-deal');
  };

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (value.trim()) {
      setEditingDeal(null);
      setActivePage('records');
    }
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'records':
        return <DealRecordsPage onEditDeal={handleEditDeal} searchTerm={searchValue} onSearchChange={setSearchValue} />;
      case 'add-deal':
        return (
          <AddDealPage
            key={editingDeal?.id ?? 'new'}
            deal={editingDeal}
            onSaved={(message) => {
              const wasEditing = Boolean(editingDeal);
              setEditingDeal(null);
              setActivePage(wasEditing ? 'records' : 'dashboard');
              showToast(message);
            }}
            onCancel={() => {
              setEditingDeal(null);
              setActivePage(editingDeal ? 'records' : 'dashboard');
            }}
          />
        );
      case 'settings':
        return (
          <SettingsPage
            profile={profile}
            onLogout={() => {
              window.localStorage.removeItem('deal-ledger-auth-token');
              setIsLoggedIn(false);
              setActivePage('dashboard');
            }}
            onSaveProfile={(nextProfile) => {
              setProfile(nextProfile);
              window.localStorage.setItem('deal-ledger-profile', JSON.stringify(nextProfile));
            }}
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  if (!isLoggedIn) {
    return (
      <LoginPage
        onLogin={(token) => {
          window.localStorage.setItem('deal-ledger-auth-token', token);
          setIsLoggedIn(true);
        }}
      />
    );
  }

  return (
    <div className="dark size-full flex flex-col bg-background text-foreground md:flex-row">
      <Sidebar activePage={activePage} onNavigate={setActivePage} profileName={profile.fullName} />
      <div className="flex-1 flex flex-col overflow-hidden pb-20 md:pb-0">
        <Header
          onAddDeal={handleAddDeal}
          searchValue={searchValue}
          onSearchChange={handleSearchChange}
        />
        {renderPage()}
      </div>
      {toastMessage && (
        <div className="fixed right-6 top-6 z-50 rounded-lg border border-green-500/30 bg-[#101510] px-4 py-3 text-sm text-green-400 shadow-xl">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
