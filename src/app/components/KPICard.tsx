import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'green' | 'red' | 'blue' | 'purple' | 'cyan' | 'default';
}

export default function KPICard({ title, value, icon: Icon, trend, trendUp, color = 'default' }: KPICardProps) {
  const colorClasses = {
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
    cyan: 'bg-cyan-500/10 text-cyan-500',
    default: 'bg-muted text-foreground',
  };

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <p className="text-foreground mb-1">{value}</p>

      {trend && (
        <p className={`text-sm ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trendUp ? '↑' : '↓'} {trend}
        </p>
      )}
    </div>
  );
}
