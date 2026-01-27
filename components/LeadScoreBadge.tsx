/**
 * LeadScoreBadge Component
 * Displays lead score with fire icons and color coding
 */

import { getScoreColors, getScoreLabel } from '../types/lead-watcher-types';

interface LeadScoreBadgeProps {
  score: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LeadScoreBadge({ score, showLabel = false, size = 'md' }: LeadScoreBadgeProps) {
  const colors = getScoreColors(score);
  const label = getScoreLabel(score);

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-lg ${colors.bg} ${sizeClasses[size]}`}>
      <span className="font-medium" style={{ minWidth: '24px' }}>
        {colors.icon || Math.round(score)}
      </span>
      {!colors.icon && (
        <span className={colors.text}>{Math.round(score)}</span>
      )}
      {showLabel && (
        <span className={`${colors.text} capitalize`}>{label}</span>
      )}
    </div>
  );
}

export default LeadScoreBadge;
