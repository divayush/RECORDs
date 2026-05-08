import { Search, PlusCircle } from 'lucide-react';

interface HeaderProps {
  onAddDeal: () => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
}

export default function Header({ onAddDeal, searchValue, onSearchChange }: HeaderProps) {
  return (
    <header className="border-b border-border bg-card px-4 py-3 md:h-16 md:px-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search deals..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-input-background rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <button
          onClick={onAddDeal}
          className="flex w-full items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors md:w-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Deal</span>
        </button>
      </div>
    </header>
  );
}
