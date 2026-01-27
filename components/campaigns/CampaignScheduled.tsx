/**
 * CampaignScheduled - View scheduled and queued actions
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  MessageSquare,
  UserPlus,
  Mail,
  Pause,
  Play,
  Loader2,
  AlertCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { StepType } from '@engage/types/campaign-types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/components/ui/utils';
import { emptyStateVariants } from '@engage/styles/variants';

interface CampaignScheduledProps {
  campaignId: string;
}

interface ScheduledAction {
  id: string;
  contact_name: string;
  contact_avatar?: string;
  contact_company?: string;
  step_type: StepType;
  step_name: string;
  scheduled_at: string;
  status: 'scheduled' | 'processing' | 'waiting';
}

const STEP_ICONS: Record<StepType, React.ElementType> = {
  invitation: UserPlus,
  message: MessageSquare,
  email: Mail,
  wait: Clock,
  condition: AlertCircle,
};

const STEP_VARIANTS: Record<StepType, 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive'> = {
  invitation: 'default',
  message: 'secondary',
  email: 'warning',
  wait: 'outline',
  condition: 'destructive',
};

export const CampaignScheduled: React.FC<CampaignScheduledProps> = ({ campaignId }) => {
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'time' | 'step'>('time');

  useEffect(() => {
    // Simulated data - replace with API call
    setLoading(true);
    setTimeout(() => {
      setActions([
        {
          id: '1',
          contact_name: 'Sarah Chen',
          contact_company: 'Stripe',
          step_type: 'invitation',
          step_name: 'Send Connection Request',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          status: 'scheduled',
        },
        {
          id: '2',
          contact_name: 'Mike Johnson',
          contact_company: 'Notion',
          step_type: 'message',
          step_name: 'Follow-up Message #1',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
          status: 'scheduled',
        },
        {
          id: '3',
          contact_name: 'Emily Rodriguez',
          contact_company: 'Linear',
          step_type: 'message',
          step_name: 'Follow-up Message #1',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
          status: 'waiting',
        },
        {
          id: '4',
          contact_name: 'David Kim',
          contact_company: 'Figma',
          step_type: 'invitation',
          step_name: 'Send Connection Request',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          status: 'scheduled',
        },
        {
          id: '5',
          contact_name: 'Anna Peters',
          contact_company: 'Vercel',
          step_type: 'email',
          step_name: 'Email Follow-up',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
          status: 'scheduled',
        },
      ]);
      setLoading(false);
    }, 500);
  }, [campaignId]);

  const getTimeLabel = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `In ${minutes} min`;
    if (hours < 24) return `In ${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  // Group actions by date
  const groupedByDate = actions.reduce((acc, action) => {
    const dateKey = new Date(action.scheduled_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(action);
    return acc;
  }, {} as Record<string, ScheduledAction[]>);

  if (loading) {
    return (
      <div className={emptyStateVariants()}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className={emptyStateVariants()}>
        <Calendar className="w-12 h-12 mb-3 text-muted-foreground" />
        <p className="font-medium">No scheduled actions</p>
        <p className="text-sm mt-1 text-muted-foreground">Actions will appear here when your campaign is running</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Scheduled Actions</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{actions.length} actions queued</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, dayActions]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/20 rounded-lg">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <h3 className="font-medium text-foreground">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h3>
              <span className="text-sm text-muted-foreground">({dayActions.length} actions)</span>
            </div>

            <div className="relative ml-5 pl-6 border-l-2 border-border space-y-3">
              {dayActions.map((action) => {
                const Icon = STEP_ICONS[action.step_type];
                const variant = STEP_VARIANTS[action.step_type];
                
                return (
                  <Card 
                    key={action.id}
                    className="relative group hover:border-primary/50 transition-all"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[33px] w-4 h-4 bg-background border-2 border-border rounded-full group-hover:border-primary transition-colors" />
                    
                    <CardContent className="p-4 flex items-center gap-4">
                      {/* Step icon */}
                      <div className={cn(
                        "p-2.5 rounded-xl",
                        variant === 'default' && "bg-primary/20",
                        variant === 'secondary' && "bg-secondary",
                        variant === 'warning' && "bg-yellow-500/20",
                        variant === 'outline' && "bg-muted"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5",
                          variant === 'default' && "text-primary",
                          variant === 'secondary' && "text-secondary-foreground",
                          variant === 'warning' && "text-yellow-500",
                          variant === 'outline' && "text-muted-foreground"
                        )} />
                      </div>

                      {/* Contact info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-foreground">{action.contact_name}</p>
                          {action.contact_company && (
                            <span className="text-sm text-muted-foreground">at {action.contact_company}</span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{action.step_name}</p>
                      </div>

                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{getTimeLabel(action.scheduled_at)}</span>
                      </div>

                      {/* Status */}
                      <Badge variant={
                        action.status === 'processing' ? 'default' :
                        action.status === 'waiting' ? 'warning' : 'secondary'
                      }>
                        {action.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                        {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                      </Badge>

                      {/* Actions */}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignScheduled;
