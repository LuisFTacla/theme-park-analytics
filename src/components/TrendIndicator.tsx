import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TREND_LABELS_PT, type Trend } from '@/utils/trend';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  trend: Trend;
  size?: number;
}

export function TrendIndicator({ trend, size = 14 }: Props) {
  const Icon = trend.direction === 'up' ? TrendingUp : trend.direction === 'down' ? TrendingDown : Minus;
  const { colors } = useTheme();
  const color = trend.direction === 'up' ? colors.danger : trend.direction === 'down' ? colors.ok : colors.muted;
  return (
    <span title={TREND_LABELS_PT[trend.direction]} style={{ color }} className="flex items-center">
      <Icon size={size} />
    </span>
  );
}
