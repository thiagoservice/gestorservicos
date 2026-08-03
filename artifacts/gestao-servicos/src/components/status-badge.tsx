import { cn } from '@/lib/utils';
import { ORDER_STATUS_LABELS, type OrderStatusValue } from '@/lib/format';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

const STATUS_STYLES: Record<OrderStatusValue, string> = {
  pending: 'bg-chart-5/15 text-chart-5 border-chart-5/30',
  in_progress: 'bg-chart-2/15 text-chart-2 border-chart-2/35',
  completed: 'bg-chart-3/15 text-chart-3 border-chart-3/35',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/30',
};

const STATUS_ICONS: Record<OrderStatusValue, typeof Clock> = {
  pending: Clock,
  in_progress: Loader2,
  completed: CheckCircle2,
  cancelled: XCircle,
};

export function StatusBadge({ status }: { status: string }) {
  const key = (status as OrderStatusValue) ?? 'pending';
  const Icon = STATUS_ICONS[key] ?? Clock;
  const label = ORDER_STATUS_LABELS[key] ?? status;

  return (
    <span
      data-testid={`status-badge-${key}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
        STATUS_STYLES[key],
      )}
    >
      <Icon
        className={cn('h-3 w-3', key === 'in_progress' && 'animate-spin')}
      />
      {label}
    </span>
  );
}
