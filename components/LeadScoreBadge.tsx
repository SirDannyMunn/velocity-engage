/**
 * LeadScoreBadge Component
 * Displays lead score with fire icons and color coding
 */

import { cn } from '@/components/ui/utils';
import { getScoreLabel } from '../types/lead-watcher-types';
import { scoreBadgeVariants, type ScoreBadgeVariants } from '../styles/variants';

interface LeadScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getScoreTier(score: number): ScoreBadgeVariants['tier'] {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'low';
  return 'poor';
}

function getScoreIcon(score: number): string | null {
  if (score >= 80) return '🔥';
  if (score >= 60) return '⚡';
  return null;
}

export function LeadScoreBadge({ score, showLabel = false, size = 'md', className }: LeadScoreBadgeProps) {
  const tier = getScoreTier(score);
  const label = getScoreLabel(score);
  const icon = getScoreIcon(score);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: '', // default from CVA
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={cn(scoreBadgeVariants({ tier }), sizeClasses[size], className)}>
      {icon && <span>{icon}</span>}
      <span className="font-medium">{Math.round(score)}</span>
      {showLabel && <span className="capitalize">{label}</span>}
    </div>
  );
}

export default LeadScoreBadge;
