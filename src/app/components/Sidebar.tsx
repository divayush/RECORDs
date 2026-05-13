import { LayoutDashboard, Database, PlusCircle, Settings, ReceiptText } from 'lucide-react';

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string) => void;
  profileName: string;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
};

export default function Sidebar({ activePage, onNavigate, profileName }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'life-stats', label: 'Real Life', icon: ReceiptText },
    { id: 'records', label: 'Deal Records', icon: Database },
    { id: 'add-deal', label: 'Add New Deal', icon: PlusCircle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar md:static md:flex md:h-screen md:w-64 md:flex-col md:border-r md:border-t-0">
      <div className="hidden p-6 border-b border-sidebar-border md:block">
        <h1 className="text-sidebar-foreground">Deal Ledger</h1>
        <p className="text-sm text-muted-foreground mt-1">Finance Tracker</p>
      </div>

      <nav className="grid grid-cols-5 gap-1 p-2 md:block md:flex-1 md:p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              } flex-col justify-center gap-1 px-2 py-2 text-xs md:flex-row md:justify-start md:gap-3 md:px-4 md:py-3 md:text-base`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="truncate">{item.id === 'add-deal' ? 'Add' : item.label.replace('Deal ', '')}</span>
            </button>
          );
        })}
      </nav>

      <div className="hidden p-4 border-t border-sidebar-border md:block">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
            {getInitials(profileName)}
          </div>
          <div className="flex-1">
            <p className="text-sm text-sidebar-foreground">{profileName}</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
