import { Search, PlusCircle } from 'lucide-react';

interface HeaderProps {
  onAddDeal: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ onAddDeal, searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onAddDeal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Deal</span>
        </button>
      </div>
    </header>
  );
}
