/**
 * SignalBadge Component
 * Displays intent signal type with color coding
 */

import { cn } from '@/components/ui/utils';
import { IntentSignal, formatSignalType, SignalType } from '../types/lead-watcher-types';
import { signalBadgeVariants, type SignalBadgeVariants } from '../styles/variants';
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
  className?: string;
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
  post_engagement: Zap,
  comment: MessageSquare,
  company_growth: TrendingUp,
  content_publish: Star,
  connection_request: Users,
  mention: MessageSquare,
};

function getSignalVariant(signalType: string): SignalBadgeVariants['signalType'] {
  const validTypes = ['post_engagement', 'comment', 'job_change', 'company_growth', 'content_publish', 'connection_request', 'mention'];
  return validTypes.includes(signalType) ? signalType as SignalBadgeVariants['signalType'] : 'default';
}

export function SignalBadge({ signal, showDescription = false, size = 'md', className }: SignalBadgeProps) {
  const Icon = SIGNAL_ICONS[signal.signal_type] || Zap;
  const signalType = getSignalVariant(signal.signal_type);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1 [&_svg]:w-3 [&_svg]:h-3',
    md: '[&_svg]:w-3.5 [&_svg]:h-3.5',
    lg: 'text-base px-3 py-1.5 gap-2 [&_svg]:w-4 [&_svg]:h-4',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className={cn(signalBadgeVariants({ signalType }), sizeClasses[size], className)}>
        <Icon />
        <span className="font-medium">
          {signal.signal_label || formatSignalType(signal.signal_type)}
        </span>
      </div>
      {showDescription && signal.explanation && (
        <p className="text-xs text-muted-foreground line-clamp-2">{signal.explanation}</p>
      )}
    </div>
  );
}

export default SignalBadge;
