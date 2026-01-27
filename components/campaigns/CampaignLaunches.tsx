/**
 * CampaignLaunches - History of campaign runs
 */

import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Play,
  Pause,
  Square,
  Clock,
  Users,
  MessageSquare,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/components/ui/utils';
import { emptyStateVariants } from '@engage/styles/variants';

interface CampaignLaunchesProps {
  campaignId: string;
}

interface CampaignLaunch {
  id: string;
  started_at: string;
  ended_at?: string;
  status: 'running' | 'paused' | 'completed' | 'stopped' | 'error';
  contacts_processed: number;
  total_contacts: number;
  messages_sent: number;
  invitations_sent: number;
  replies_received: number;
  errors: number;
  triggered_by: 'manual' | 'schedule' | 'auto';
}

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: React.ElementType }> = {
  running: { label: 'Running', variant: 'success', icon: Play },
  paused: { label: 'Paused', variant: 'warning', icon: Pause },
  completed: { label: 'Completed', variant: 'default', icon: Check },
  stopped: { label: 'Stopped', variant: 'secondary', icon: Square },
  error: { label: 'Error', variant: 'destructive', icon: AlertCircle },
};

export const CampaignLaunches: React.FC<CampaignLaunchesProps> = ({ campaignId }) => {
  const [launches, setLaunches] = useState<CampaignLaunch[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    // Simulated data - replace with API call
    setLoading(true);
    setTimeout(() => {
      setLaunches([
        {
          id: '1',
          started_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          status: 'running',
          contacts_processed: 45,
          total_contacts: 150,
          messages_sent: 32,
          invitations_sent: 23,
          replies_received: 8,
          errors: 0,
          triggered_by: 'manual',
        },
        {
          id: '2',
          started_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          ended_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
          status: 'completed',
          contacts_processed: 100,
          total_contacts: 100,
          messages_sent: 87,
          invitations_sent: 100,
          replies_received: 24,
          errors: 3,
          triggered_by: 'schedule',
        },
        {
          id: '3',
          started_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
          ended_at: new Date(Date.now() - 1000 * 60 * 60 * 47).toISOString(),
          status: 'stopped',
          contacts_processed: 25,
          total_contacts: 150,
          messages_sent: 18,
          invitations_sent: 25,
          replies_received: 4,
          errors: 0,
          triggered_by: 'manual',
        },
        {
          id: '4',
          started_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
          ended_at: new Date(Date.now() - 1000 * 60 * 60 * 70).toISOString(),
          status: 'error',
          contacts_processed: 12,
          total_contacts: 75,
          messages_sent: 8,
          invitations_sent: 12,
          replies_received: 2,
          errors: 5,
          triggered_by: 'auto',
        },
      ]);
      setLoading(false);
    }, 500);
  }, [campaignId]);

  const getDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diff = endTime - startTime;
    
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className={emptyStateVariants()}>
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (launches.length === 0) {
    return (
      <div className={emptyStateVariants()}>
        <Rocket className="w-12 h-12 mb-3 text-muted-foreground" />
        <p className="font-medium">No launches yet</p>
        <p className="text-sm mt-1 text-muted-foreground">Start your campaign to see launch history</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Launch History</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{launches.length} total launches</p>
        </div>
      </div>

      {/* Launches List */}
      <div className="space-y-4">
        {launches.map((launch) => {
          const config = STATUS_CONFIG[launch.status];
          const StatusIcon = config.icon;
          const isExpanded = expandedId === launch.id;
          const progress = (launch.contacts_processed / launch.total_contacts) * 100;
          
          return (
            <Card key={launch.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <Collapsible open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : launch.id)}>
                <CollapsibleTrigger asChild>
                  <button className="w-full flex items-center gap-4 p-4 text-left">
                    <div className={cn(
                      "p-2.5 rounded-xl",
                      config.variant === 'success' && "bg-green-500/20",
                      config.variant === 'warning' && "bg-yellow-500/20",
                      config.variant === 'default' && "bg-primary/20",
                      config.variant === 'secondary' && "bg-muted",
                      config.variant === 'destructive' && "bg-destructive/20"
                    )}>
                      <StatusIcon className={cn(
                        "w-5 h-5",
                        config.variant === 'success' && "text-green-500",
                        config.variant === 'warning' && "text-yellow-500",
                        config.variant === 'default' && "text-primary",
                        config.variant === 'secondary' && "text-muted-foreground",
                        config.variant === 'destructive' && "text-destructive"
                      )} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-foreground">
                          {new Date(launch.started_at).toLocaleString()}
                        </p>
                        <Badge variant={config.variant}>
                          {config.label}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {launch.triggered_by}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-muted-foreground">
                          {launch.contacts_processed}/{launch.total_contacts} contacts
                        </span>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          {getDuration(launch.started_at, launch.ended_at)} duration
                        </span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-32">
                      <Progress 
                        value={progress} 
                        className={cn(
                          launch.status === 'error' && "[&>div]:bg-destructive"
                        )}
                      />
                      <p className="text-xs text-muted-foreground mt-1 text-right">{progress.toFixed(0)}%</p>
                    </div>

                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="px-4 pb-4 pt-2 border-t border-border">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <StatCard
                        icon={Users}
                        label="Invitations Sent"
                        value={launch.invitations_sent}
                        color="text-primary"
                      />
                      <StatCard
                        icon={MessageSquare}
                        label="Messages Sent"
                        value={launch.messages_sent}
                        color="text-secondary-foreground"
                      />
                      <StatCard
                        icon={Check}
                        label="Replies Received"
                        value={launch.replies_received}
                        color="text-green-500"
                      />
                      <StatCard
                        icon={AlertCircle}
                        label="Errors"
                        value={launch.errors}
                        color="text-destructive"
                      />
                    </div>

                    {launch.errors > 0 && (
                      <div className="mt-4 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                        <p className="text-sm text-destructive">
                          {launch.errors} actions failed during this run. Check the logs for details.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
}> = ({ icon: Icon, label, value, color }) => (
  <div className="p-3 bg-muted/50 rounded-xl">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={cn("w-4 h-4", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <p className="text-xl font-bold text-foreground">{value}</p>
  </div>
);

export default CampaignLaunches;
