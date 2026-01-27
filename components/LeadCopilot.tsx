/**
 * LeadCopilot Component
 * Today's priority queue with autopilot/review mode
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  Zap,
  Eye,
  ChevronRight,
  Users,
  Check,
  HelpCircle,
  Archive,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
  Play,
  Pause,
  Settings,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  LeadQueueEntry,
  IcpProfile,
  LeadStatus,
  formatRelativeTime,
} from '../types/lead-watcher-types';
import { LeadScoreBadge } from './LeadScoreBadge';
import { SignalBadge } from './SignalBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/components/ui/utils';
import {
  pageHeaderVariants,
  headerIconVariants,
  emptyStateVariants,
} from '../styles/variants';

interface LeadCopilotProps {
  onNavigate?: (page: string) => void;
}

export function LeadCopilot({ onNavigate }: LeadCopilotProps) {
  const [queue, setQueue] = useState<LeadQueueEntry[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IcpProfile[]>([]);
  const [selectedIcpId, setSelectedIcpId] = useState<string>('');
  const [selectedEntry, setSelectedEntry] = useState<LeadQueueEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'autopilot' | 'review'>('review');
  const [building, setBuilding] = useState(false);

  const loadIcpProfiles = useCallback(async () => {
    try {
      const response = await leadWatcherApi.listIcpProfiles();
      setIcpProfiles(response.data.filter((p) => p.is_active));
      if (response.data.length > 0 && !selectedIcpId) {
        setSelectedIcpId(response.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load ICP profiles:', err);
    }
  }, [selectedIcpId]);

  const loadQueue = useCallback(async () => {
    if (!selectedIcpId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await leadWatcherApi.getTodayQueue({
        organization_id: '',
        icp_profile_id: selectedIcpId,
      });
      setQueue(response.data);
      if (response.data.length > 0 && !selectedEntry) {
        setSelectedEntry(response.data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load queue');
      setQueue([]);
    } finally {
      setLoading(false);
    }
  }, [selectedIcpId, selectedEntry]);

  useEffect(() => {
    loadIcpProfiles();
  }, [loadIcpProfiles]);

  useEffect(() => {
    if (selectedIcpId) {
      loadQueue();
    }
  }, [selectedIcpId, loadQueue]);

  const handleBuildQueue = async () => {
    if (!selectedIcpId) return;
    setBuilding(true);
    try {
      await leadWatcherApi.buildQueue(selectedIcpId);
      await loadQueue();
    } catch (err) {
      console.error('Failed to build queue:', err);
    } finally {
      setBuilding(false);
    }
  };

  const handleAction = async (entryId: string, action: 'approve' | 'skip' | 'archive') => {
    try {
      await leadWatcherApi.markQueueActioned(entryId);
      setQueue((prev) => prev.filter((e) => e.id !== entryId));
      
      // Select next entry
      const currentIndex = queue.findIndex((e) => e.id === entryId);
      if (queue[currentIndex + 1]) {
        setSelectedEntry(queue[currentIndex + 1]);
      } else if (queue[currentIndex - 1]) {
        setSelectedEntry(queue[currentIndex - 1]);
      } else {
        setSelectedEntry(null);
      }
    } catch (err) {
      console.error('Failed to action lead:', err);
    }
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      await leadWatcherApi.updateLeadStatus(leadId, status);
      if (selectedEntry && selectedEntry.lead.id === leadId) {
        setSelectedEntry({
          ...selectedEntry,
          lead: { ...selectedEntry.lead, status },
        });
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const unactionedQueue = queue.filter((e) => !e.actioned_at);

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className={pageHeaderVariants()}>
              <div className={headerIconVariants()}>
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Lead Copilot</h1>
                <p className="text-sm text-muted-foreground">
                  AI-curated leads ready for outreach
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-xl">
                <Button
                  variant={mode === 'review' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('review')}
                  className="gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Review
                </Button>
                <Button
                  variant={mode === 'autopilot' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setMode('autopilot')}
                  className="gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Autopilot
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={handleBuildQueue}
                disabled={building || !selectedIcpId}
                className="gap-2"
              >
                {building ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Build Queue
              </Button>
            </div>
          </div>

          {/* ICP Selector */}
          <div className="flex items-center gap-4">
            <Select value={selectedIcpId} onValueChange={setSelectedIcpId}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select ICP Profile" />
              </SelectTrigger>
              <SelectContent>
                {icpProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground">
              {unactionedQueue.length} leads in today's queue
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Queue List */}
        <div className="w-80 border-r border-border overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              Today's Priority
            </h3>
            
            {loading ? (
              <div className={emptyStateVariants()}>
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className={emptyStateVariants()}>
                <AlertCircle className="w-8 h-8 text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            ) : unactionedQueue.length === 0 ? (
              <div className={emptyStateVariants()}>
                <Users className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Queue is empty</p>
                <Button
                  variant="link"
                  onClick={handleBuildQueue}
                  disabled={building || !selectedIcpId}
                  className="mt-3 text-primary"
                >
                  Build new queue
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {unactionedQueue.map((entry, index) => (
                  <button
                    key={entry.id}
                    onClick={() => setSelectedEntry(entry)}
                    className={cn(
                      'w-full p-3 rounded-xl text-left transition-colors border',
                      selectedEntry?.id === entry.id
                        ? 'bg-primary/10 border-primary/30'
                        : 'bg-muted hover:bg-muted/80 border-transparent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground">
                        <AvatarFallback className="bg-transparent text-sm font-medium">
                          {index + 1}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {entry.lead.display_name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.lead.headline || entry.lead.company_name}
                        </p>
                      </div>
                      <LeadScoreBadge score={entry.overall_score} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Lead Detail */}
        <div className="flex-1 overflow-y-auto">
          {selectedEntry ? (
            <div className="p-6">
              {/* Lead Header */}
              <div className="flex items-start gap-4 mb-6">
                <Avatar className="h-16 w-16 bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground">
                  <AvatarFallback className="bg-transparent text-2xl font-medium">
                    {selectedEntry.lead.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">
                      {selectedEntry.lead.display_name}
                    </h2>
                    {selectedEntry.lead.profile_url && (
                      <a
                        href={selectedEntry.lead.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-500/80"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </a>
                    )}
                  </div>
                  <p className="text-muted-foreground mt-1">
                    {selectedEntry.lead.headline}
                  </p>
                  {selectedEntry.lead.company_name && (
                    <p className="text-muted-foreground/60 text-sm">
                      @ {selectedEntry.lead.company_name}
                    </p>
                  )}
                </div>
                <LeadScoreBadge score={selectedEntry.overall_score} showLabel size="lg" />
              </div>

              {/* Why This Lead */}
              <Card className="mb-6">
                <CardContent className="p-5">
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    Why This Lead?
                  </h3>
                  <p className="mb-4">{selectedEntry.why.primary_reason}</p>
                  
                  {selectedEntry.why.top_signals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">
                        Top Signals
                      </p>
                      {selectedEntry.why.top_signals.map((signal, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 bg-background rounded-lg"
                        >
                          <span className="text-sm">{signal.label}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(signal.occurred_at)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* ICP Match */}
              {Object.keys(selectedEntry.why.icp_match).length > 0 && (
                <Card className="mb-6">
                  <CardContent className="p-5">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      ICP Match
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(selectedEntry.why.icp_match).map(([key, value]) => (
                        <div
                          key={key}
                          className={cn(
                            'flex items-center gap-2 p-2 rounded-lg',
                            value === 'match'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-destructive/10 text-destructive'
                          )}
                        >
                          {value === 'match' ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                          <span className="text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => {
                    handleStatusChange(selectedEntry.lead.id, 'shortlisted');
                    handleAction(selectedEntry.id, 'approve');
                  }}
                  className="flex-1 gap-2"
                  size="lg"
                >
                  <Check className="w-5 h-5" />
                  Approve & Start Outreach
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAction(selectedEntry.id, 'skip')}
                  size="lg"
                  className="gap-2"
                >
                  <HelpCircle className="w-5 h-5" />
                  Skip
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleStatusChange(selectedEntry.lead.id, 'archived');
                    handleAction(selectedEntry.id, 'archive');
                  }}
                  size="lg"
                >
                  <Archive className="w-5 h-5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className={emptyStateVariants({ className: 'h-full' })}>
              <Sparkles className="w-12 h-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Select a lead to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LeadCopilot;
