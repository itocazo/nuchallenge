import { cn } from '@/lib/utils';

const ACCENT_COLORS: Record<string, string> = {
  purple: 'bg-purple-50 text-purple-600',
  blue: 'bg-blue-50 text-blue-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  orange: 'bg-orange-50 text-orange-600',
};

export default function StatCard({
  icon: Icon,
  label,
  value,
  accent = 'purple',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', ACCENT_COLORS[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="tabular-nums text-xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
