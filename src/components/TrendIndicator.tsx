import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TREND_LABELS_PT, type Trend } from '@/utils/trend';

interface Props {
  trend: Trend;
  size?: number;
}

export function TrendIndicator({ trend, size = 14 }: Props) {
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const color = trend.direction === 'up' ? '#ef4444' : trend.direction === 'down' ? '#4ade80' : '#94a3b8';
  return (
    <span title={TREND_LABELS_PT[trend.direction]} style={{ color }} className="flex items-center">
      <Icon size={size} />
    </span>
  );
}
