/**
 * Engage Package - CVA Style Variants
 * Standardized class variance authority definitions for consistent styling
 */

import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Page Header - Used for main section headers with icon and title
 */
export const pageHeaderVariants = cva(
  'flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm',
  {
    variants: {
      padding: {
        default: 'px-6 py-4',
        compact: 'px-4 py-3',
        none: '',
      },
    },
    defaultVariants: {
      padding: 'default',
    },
  }
);

/**
 * Header Icon - Gradient icon container for headers
 */
export const headerIconVariants = cva(
  'flex items-center justify-center text-white',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 rounded-lg',
        default: 'w-10 h-10 rounded-xl',
        lg: 'w-12 h-12 rounded-xl',
      },
      color: {
        primary: 'bg-gradient-to-br from-primary to-emerald-600',
        secondary: 'bg-gradient-to-br from-blue-500 to-blue-600',
        warning: 'bg-gradient-to-br from-yellow-500 to-orange-500',
        destructive: 'bg-gradient-to-br from-red-500 to-red-600',
      },
    },
    defaultVariants: {
      size: 'default',
      color: 'primary',
    },
  }
);

/**
 * Status Badge - For lead status, agent status, etc.
 */
export const statusBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg text-sm px-2.5 py-1 font-medium',
  {
    variants: {
      status: {
        new: 'bg-blue-500/10 text-blue-400',
        reviewing: 'bg-yellow-500/10 text-yellow-400',
        shortlisted: 'bg-primary/10 text-primary',
        archived: 'bg-muted text-muted-foreground',
        active: 'bg-primary/10 text-primary',
        paused: 'bg-yellow-500/10 text-yellow-400',
        error: 'bg-destructive/10 text-destructive',
        idle: 'bg-muted text-muted-foreground',
        pending: 'bg-yellow-500/10 text-yellow-400',
        running: 'bg-blue-500/10 text-blue-400',
        completed: 'bg-primary/10 text-primary',
        failed: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      status: 'new',
    },
  }
);

/**
 * Score Badge - For lead/ICP scores with color gradients
 */
export const scoreBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg text-sm px-2 py-1 font-medium',
  {
    variants: {
      tier: {
        excellent: 'bg-primary/10 text-primary',
        good: 'bg-blue-500/10 text-blue-400',
        fair: 'bg-yellow-500/10 text-yellow-400',
        low: 'bg-orange-500/10 text-orange-400',
        poor: 'bg-destructive/10 text-destructive',
      },
    },
    defaultVariants: {
      tier: 'fair',
    },
  }
);

/**
 * Signal Badge - For intent signals with signal-specific colors
 */
export const signalBadgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-lg text-sm px-2 py-1 font-medium',
  {
    variants: {
      signalType: {
        post_engagement: 'bg-blue-500/10 text-blue-400',
        comment: 'bg-purple-500/10 text-purple-400',
        job_change: 'bg-orange-500/10 text-orange-400',
        company_growth: 'bg-primary/10 text-primary',
        content_publish: 'bg-cyan-500/10 text-cyan-400',
        connection_request: 'bg-pink-500/10 text-pink-400',
        mention: 'bg-yellow-500/10 text-yellow-400',
        default: 'bg-muted text-muted-foreground',
      },
    },
    defaultVariants: {
      signalType: 'default',
    },
  }
);

/**
 * Icon Button - Small icon-only action buttons
 */
export const iconButtonVariants = cva(
  'p-1.5 rounded-lg transition-colors',
  {
    variants: {
      intent: {
        default: 'hover:bg-accent text-muted-foreground hover:text-foreground',
        primary: 'hover:bg-primary/10 text-muted-foreground hover:text-primary',
        success: 'hover:bg-primary/10 text-muted-foreground hover:text-primary',
        warning: 'hover:bg-yellow-500/10 text-muted-foreground hover:text-yellow-400',
        destructive: 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive',
      },
      active: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        intent: 'primary',
        active: true,
        class: 'bg-primary/20 text-primary',
      },
      {
        intent: 'success',
        active: true,
        class: 'bg-primary/20 text-primary',
      },
      {
        intent: 'warning',
        active: true,
        class: 'bg-yellow-500/20 text-yellow-400',
      },
      {
        intent: 'destructive',
        active: true,
        class: 'bg-destructive/20 text-destructive',
      },
    ],
    defaultVariants: {
      intent: 'default',
      active: false,
    },
  }
);

/**
 * Content Panel - For collapsible sections and panels
 */
export const contentPanelVariants = cva(
  'border rounded-xl overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-border/50',
        ghost: 'border-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Panel Header - Collapsible section header
 */
export const panelHeaderVariants = cva(
  'w-full flex items-center justify-between p-4 transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-muted/50 hover:bg-muted',
        ghost: 'hover:bg-accent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Filter Chip - Selectable filter/tag items
 */
export const filterChipVariants = cva(
  'px-3 py-2 rounded-lg text-sm text-left transition-colors truncate border',
  {
    variants: {
      selected: {
        true: 'bg-primary/20 text-primary border-primary/30',
        false: 'bg-muted/50 text-muted-foreground border-border hover:bg-muted',
      },
    },
    defaultVariants: {
      selected: false,
    },
  }
);

/**
 * Info Row - Key-value display rows
 */
export const infoRowVariants = cva(
  'flex items-center gap-3 p-3 rounded-xl',
  {
    variants: {
      variant: {
        default: 'bg-muted/50',
        ghost: '',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Action Button Group - Group of action buttons
 */
export const actionGroupVariants = cva(
  'flex items-center',
  {
    variants: {
      gap: {
        sm: 'gap-1',
        default: 'gap-2',
        lg: 'gap-3',
      },
    },
    defaultVariants: {
      gap: 'default',
    },
  }
);

/**
 * Avatar - User/lead avatar with fallback
 */
export const avatarVariants = cva(
  'rounded-full bg-gradient-to-br from-primary to-emerald-600 flex items-center justify-center text-primary-foreground font-medium flex-shrink-0 overflow-hidden',
  {
    variants: {
      size: {
        sm: 'w-8 h-8 text-sm',
        default: 'w-10 h-10 text-base',
        lg: 'w-12 h-12 text-lg',
        xl: 'w-16 h-16 text-2xl',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

/**
 * Empty State - For empty lists and states
 */
export const emptyStateVariants = cva(
  'flex flex-col items-center justify-center gap-4',
  {
    variants: {
      size: {
        sm: 'h-32 [&_svg]:w-8 [&_svg]:h-8',
        default: 'h-64 [&_svg]:w-12 [&_svg]:h-12',
        lg: 'h-96 [&_svg]:w-16 [&_svg]:h-16',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

// Export type helpers
export type PageHeaderVariants = VariantProps<typeof pageHeaderVariants>;
export type HeaderIconVariants = VariantProps<typeof headerIconVariants>;
export type StatusBadgeVariants = VariantProps<typeof statusBadgeVariants>;
export type ScoreBadgeVariants = VariantProps<typeof scoreBadgeVariants>;
export type SignalBadgeVariants = VariantProps<typeof signalBadgeVariants>;
export type IconButtonVariants = VariantProps<typeof iconButtonVariants>;
export type ContentPanelVariants = VariantProps<typeof contentPanelVariants>;
export type PanelHeaderVariants = VariantProps<typeof panelHeaderVariants>;
export type FilterChipVariants = VariantProps<typeof filterChipVariants>;
export type InfoRowVariants = VariantProps<typeof infoRowVariants>;
export type ActionGroupVariants = VariantProps<typeof actionGroupVariants>;
export type AvatarVariants = VariantProps<typeof avatarVariants>;
export type EmptyStateVariants = VariantProps<typeof emptyStateVariants>;
