/**
 * SignalBadge Component
 * Displays intent signal type with color coding
 */

import { IntentSignal, getSignalColors, formatSignalType } from '../types/lead-watcher-types';
import {
  MessageSquare,
  AlertTriangle,
  Users,
  Zap,
  TrendingUp,
  Briefcase,
  Star,
  DollarSign,
} from 'lucide-react';

interface SignalBadgeProps {
  signal: IntentSignal;
  showDescription?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  commented_interest: MessageSquare,
  pain_point_complaint: AlertTriangle,
  engaged_competitor: Users,
  engaged_influencer: Star,
  high_activity_spike: TrendingUp,
  job_change: Briefcase,
  top_5_percent: Zap,
  recently_raised_funds: DollarSign,
};

export function SignalBadge({ signal, showDescription = false, size = 'md' }: SignalBadgeProps) {
  const colors = getSignalColors(signal.signal_type);
  const Icon = SIGNAL_ICONS[signal.signal_type] || Zap;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-sm px-2 py-1 gap-1.5',
    lg: 'text-base px-3 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={`inline-flex items-center rounded-lg ${colors.bg} ${sizeClasses[size]}`}>
        <Icon className={`${iconSizes[size]} ${colors.text}`} />
        <span className={`font-medium ${colors.text}`}>
          {signal.signal_label || formatSignalType(signal.signal_type)}
        </span>
      </div>
      {showDescription && signal.explanation && (
        <p className="text-xs text-gray-400 line-clamp-2">{signal.explanation}</p>
      )}
    </div>
  );
}

export default SignalBadge;
