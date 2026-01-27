/**
 * SignalsAgentsList Component
 * List of signals agents with status, controls, and configuration
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Bot,
  Play,
  Pause,
  Settings,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  XCircle,
  RefreshCw,
  Trash2,
  ChevronDown,
  ChevronUp,
  Activity,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  SignalsAgent,
  AgentStatus,
  SignalType,
  formatSignalType,
  formatRelativeTime,
  IcpProfile,
} from '../types/lead-watcher-types';

// shadcn components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// CVA variants
import { pageHeaderVariants, headerIconVariants, emptyStateVariants, statusBadgeVariants } from '../styles/variants';

interface SignalsAgentsListProps {
  onNavigate?: (page: string) => void;
}

const SIGNAL_TYPE_OPTIONS: { value: SignalType; label: string; description: string }[] = [
  { value: 'post_engagement', label: 'Post Engagement', description: 'Track likes, comments, and shares on posts' },
  { value: 'comment', label: 'Comment Activity', description: 'Monitor comment patterns and sentiment' },
  { value: 'job_change', label: 'Job Changes', description: 'Detect role or company changes' },
  { value: 'company_growth', label: 'Company Growth', description: 'Track headcount and funding changes' },
  { value: 'content_publish', label: 'Content Publishing', description: 'Monitor article and post creation' },
  { value: 'connection_request', label: 'Connection Requests', description: 'Track network expansion' },
  { value: 'mention', label: 'Mentions', description: 'Track when leads mention relevant topics' },
];

export function SignalsAgentsList({ onNavigate }: SignalsAgentsListProps) {
  const [agents, setAgents] = useState<SignalsAgent[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IcpProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [agentsResponse, icpResponse] = await Promise.all([
        leadWatcherApi.listSignalsAgents(),
        leadWatcherApi.listIcpProfiles(),
      ]);
      setAgents(agentsResponse.data);
      setIcpProfiles(icpResponse.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStart = async (agentId: string) => {
    setActionLoading((prev) => ({ ...prev, [agentId]: true }));
    try {
      await leadWatcherApi.startSignalsAgent(agentId);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, status: 'active' as AgentStatus } : a
        )
      );
    } catch (err: any) {
      console.error('Failed to start agent:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const handlePause = async (agentId: string) => {
    setActionLoading((prev) => ({ ...prev, [agentId]: true }));
    try {
      await leadWatcherApi.pauseSignalsAgent(agentId);
      setAgents((prev) =>
        prev.map((a) =>
          a.id === agentId ? { ...a, status: 'paused' as AgentStatus } : a
        )
      );
    } catch (err: any) {
      console.error('Failed to pause agent:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const handleDelete = async (agentId: string) => {
    if (!confirm('Are you sure you want to delete this agent?')) return;
    
    setActionLoading((prev) => ({ ...prev, [agentId]: true }));
    try {
      await leadWatcherApi.deleteSignalsAgent(agentId);
      setAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch (err: any) {
      console.error('Failed to delete agent:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [agentId]: false }));
    }
  };

  const getStatusIcon = (status: AgentStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      case 'idle':
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getIcpName = (icpId: string) => {
    const profile = icpProfiles.find((p) => p.id === icpId);
    return profile?.name || 'Unknown ICP';
  };

  if (loading) {
    return (
      <div className={emptyStateVariants()}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className={pageHeaderVariants()}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={headerIconVariants({ gradient: 'emerald' })}>
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Signals Agents</h1>
                <p className="text-sm text-muted-foreground">
                  {agents.length} agents • {agents.filter((a) => a.status === 'active').length} active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadData()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                <PlusCircle className="w-5 h-5" />
                New Agent
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadData()}>
              Retry
            </Button>
          </div>
        ) : agents.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Bot className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-xl font-medium">No agents yet</p>
            <p className="text-muted-foreground text-center max-w-md">
              Create your first signals agent to start monitoring lead activity
            </p>
            <Button onClick={() => setShowCreateModal(true)} className="gap-2">
              <PlusCircle className="w-5 h-5" />
              Create Agent
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const isExpanded = expandedAgentId === agent.id;
              const isLoading = actionLoading[agent.id];
              
              const statusVariant = agent.status === 'active' ? 'active' :
                                     agent.status === 'paused' ? 'paused' :
                                     agent.status === 'error' ? 'archived' : 'new';

              return (
                <Card key={agent.id} className="overflow-hidden">
                  {/* Agent Header */}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center',
                          agent.status === 'active' && 'bg-green-500/10',
                          agent.status === 'paused' && 'bg-yellow-500/10',
                          agent.status === 'error' && 'bg-destructive/10',
                          agent.status === 'idle' && 'bg-muted'
                        )}>
                          <Bot className={cn(
                            'w-6 h-6',
                            agent.status === 'active' && 'text-green-500',
                            agent.status === 'paused' && 'text-yellow-500',
                            agent.status === 'error' && 'text-destructive',
                            agent.status === 'idle' && 'text-muted-foreground'
                          )} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{agent.name}</h3>
                          <Badge variant="outline" className={cn(statusBadgeVariants({ status: statusVariant }))}>
                            {getStatusIcon(agent.status)}
                            <span className="capitalize ml-1">{agent.status}</span>
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {agent.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePause(agent.id)}
                            disabled={isLoading}
                            className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStart(agent.id)}
                            disabled={isLoading}
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(agent.id)}
                          disabled={isLoading}
                          className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">ICP Profile</span>
                        <span>{getIcpName(agent.icp_profile_id)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Signals Monitoring</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(agent.signals_config?.enabled_signals || []).slice(0, 3).map((signal) => (
                            <Badge key={signal} variant="secondary" className="text-xs">
                              {formatSignalType(signal)}
                            </Badge>
                          ))}
                          {(agent.signals_config?.enabled_signals?.length || 0) > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{(agent.signals_config?.enabled_signals?.length || 0) - 3}
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Leads Generated</span>
                        <span className="font-medium text-primary">
                          {agent.leads_generated?.toLocaleString() || 0}
                        </span>
                      </div>

                      {agent.last_run_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Last Run</span>
                          <span className="text-muted-foreground">
                            {formatRelativeTime(agent.last_run_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expand Button */}
                    <Collapsible open={isExpanded} onOpenChange={() => setExpandedAgentId(isExpanded ? null : agent.id)}>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full mt-4 pt-3 border-t border-border"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                  
                      <CollapsibleContent className="border-t border-border pt-4 mt-4 bg-muted/30 -mx-5 -mb-5 px-5 pb-5">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Enabled Signals
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {(agent.signals_config?.enabled_signals || []).map((signal) => (
                                <Badge key={signal} variant="outline" className="gap-1.5">
                                  <Zap className="w-3.5 h-3.5 text-yellow-500" />
                                  {formatSignalType(signal)}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-2">
                              Configuration
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Min Score</span>
                                <span>
                                  {agent.signals_config?.min_score_threshold ?? 40}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Check Frequency</span>
                                <span>
                                  {agent.signals_config?.check_frequency_hours || 24}h
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Auto Queue</span>
                                <span className={agent.signals_config?.auto_queue ? 'text-primary' : 'text-muted-foreground'}>
                                  {agent.signals_config?.auto_queue ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Auto Enrich</span>
                                <span className={agent.signals_config?.auto_enrich ? 'text-primary' : 'text-muted-foreground'}>
                                  {agent.signals_config?.auto_enrich ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-2">
                            <Button variant="outline" className="flex-1 gap-2">
                              <Settings className="w-4 h-4" />
                              Edit Config
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Activity className="w-4 h-4" />
                              View Logs
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Signals Agent</DialogTitle>
            <DialogDescription>
              Set up a new agent to monitor lead activity
            </DialogDescription>
          </DialogHeader>
          <CreateAgentModalContent
            icpProfiles={icpProfiles}
            signalTypes={SIGNAL_TYPE_OPTIONS}
            onClose={() => setShowCreateModal(false)}
            onCreated={(agent) => {
              setAgents((prev) => [...prev, agent]);
              setShowCreateModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Create Agent Modal Content Component
interface CreateAgentModalContentProps {
  icpProfiles: IcpProfile[];
  signalTypes: { value: SignalType; label: string; description: string }[];
  onClose: () => void;
  onCreated: (agent: SignalsAgent) => void;
}

function CreateAgentModalContent({
  icpProfiles,
  signalTypes,
  onClose,
  onCreated,
}: CreateAgentModalContentProps) {
  const [name, setName] = useState('');
  const [icpProfileId, setIcpProfileId] = useState('');
  const [enabledSignals, setEnabledSignals] = useState<SignalType[]>(['post_engagement', 'job_change']);
  const [minScore, setMinScore] = useState([40]);
  const [autoQueue, setAutoQueue] = useState(true);
  const [autoEnrich, setAutoEnrich] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSignal = (signal: SignalType) => {
    setEnabledSignals((prev) =>
      prev.includes(signal)
        ? prev.filter((s) => s !== signal)
        : [...prev, signal]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !icpProfileId || enabledSignals.length === 0) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await leadWatcherApi.createSignalsAgent({
        name: name.trim(),
        icp_profile_id: icpProfileId,
        signals_config: {
          enabled_signals: enabledSignals,
          min_score_threshold: minScore[0],
          auto_queue: autoQueue,
          auto_enrich: autoEnrich,
        },
      });
      onCreated(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to create agent');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="agent-name">Agent Name *</Label>
        <Input
          id="agent-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Enterprise SaaS Signals"
        />
      </div>

      {/* ICP Profile */}
      <div className="space-y-2">
        <Label>ICP Profile *</Label>
        <Select value={icpProfileId} onValueChange={setIcpProfileId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an ICP profile" />
          </SelectTrigger>
          <SelectContent>
            {icpProfiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Signal Types */}
      <div className="space-y-2">
        <Label>Signals to Monitor *</Label>
        <div className="grid grid-cols-1 gap-2">
          {signalTypes.map((signal) => (
            <button
              key={signal.value}
              type="button"
              onClick={() => toggleSignal(signal.value)}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border transition-colors text-left',
                enabledSignals.includes(signal.value)
                  ? 'bg-primary/10 border-primary/50'
                  : 'bg-muted border-border hover:border-border/80'
              )}
            >
              <Checkbox
                checked={enabledSignals.includes(signal.value)}
                onCheckedChange={() => toggleSignal(signal.value)}
                className="mt-0.5"
              />
              <div>
                <p className="font-medium">{signal.label}</p>
                <p className="text-sm text-muted-foreground">{signal.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Min Score */}
      <div className="space-y-2">
        <Label>Minimum Score Threshold: {minScore[0]}</Label>
        <Slider
          value={minScore}
          onValueChange={setMinScore}
          min={0}
          max={100}
          step={5}
        />
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Checkbox
            id="auto-queue"
            checked={autoQueue}
            onCheckedChange={(checked) => setAutoQueue(!!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="auto-queue" className="cursor-pointer">
              Auto-queue high-score leads
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically add leads with signals to daily queue
            </p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Checkbox
            id="auto-enrich"
            checked={autoEnrich}
            onCheckedChange={(checked) => setAutoEnrich(!!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label htmlFor="auto-enrich" className="cursor-pointer">
              Auto-enrich emails
            </Label>
            <p className="text-sm text-muted-foreground">
              Automatically find emails for new leads
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="flex-1 gap-2">
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Bot className="w-5 h-5" />
              Create Agent
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default SignalsAgentsList;
