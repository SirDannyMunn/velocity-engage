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
  MoreVertical,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  XCircle,
  RefreshCw,
  Trash2,
  Copy,
  ChevronDown,
  ChevronUp,
  Activity,
  Calendar,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  SignalsAgent,
  AgentStatus,
  SignalType,
  AGENT_STATUS_COLORS,
  formatSignalType,
  formatRelativeTime,
  IcpProfile,
} from '../types/lead-watcher-types';

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
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-emerald-600 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Signals Agents</h1>
                <p className="text-sm text-gray-400">
                  {agents.length} agents • {agents.filter((a) => a.status === 'active').length} active
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <PlusCircle className="w-5 h-5" />
                New Agent
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => loadData()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Bot className="w-16 h-16 text-gray-600" />
            <p className="text-xl font-medium text-white">No agents yet</p>
            <p className="text-gray-400 text-center max-w-md">
              Create your first signals agent to start monitoring lead activity
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <PlusCircle className="w-5 h-5" />
              Create Agent
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {agents.map((agent) => {
              const statusColors = AGENT_STATUS_COLORS[agent.status];
              const isExpanded = expandedAgentId === agent.id;
              const isLoading = actionLoading[agent.id];

              return (
                <div
                  key={agent.id}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Agent Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${statusColors.bg}`}>
                          <Bot className={`w-6 h-6 ${statusColors.text}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{agent.name}</h3>
                          <div className={`flex items-center gap-1.5 text-sm ${statusColors.text}`}>
                            {getStatusIcon(agent.status)}
                            <span className="capitalize">{agent.status}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {agent.status === 'active' ? (
                          <button
                            onClick={() => handlePause(agent.id)}
                            disabled={isLoading}
                            className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Pause className="w-4 h-4" />
                            )}
                          </button>
                        ) : (
                          <button
                            onClick={() => handleStart(agent.id)}
                            disabled={isLoading}
                            className="p-2 bg-[#10b981]/20 text-[#10b981] rounded-lg hover:bg-[#10b981]/30 transition-colors disabled:opacity-50"
                          >
                            {isLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(agent.id)}
                          disabled={isLoading}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Agent Info */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">ICP Profile</span>
                        <span className="text-white">{getIcpName(agent.icp_profile_id)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Signals Monitoring</span>
                        <div className="flex flex-wrap gap-1 justify-end">
                          {(agent.signals_config?.enabled_signals || []).slice(0, 3).map((signal) => (
                            <span
                              key={signal}
                              className="px-2 py-0.5 bg-white/10 text-gray-300 rounded text-xs"
                            >
                              {formatSignalType(signal)}
                            </span>
                          ))}
                          {(agent.signals_config?.enabled_signals?.length || 0) > 3 && (
                            <span className="px-2 py-0.5 bg-white/10 text-gray-400 rounded text-xs">
                              +{(agent.signals_config?.enabled_signals?.length || 0) - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">Leads Generated</span>
                        <span className="font-medium text-[#10b981]">
                          {agent.leads_generated?.toLocaleString() || 0}
                        </span>
                      </div>

                      {agent.last_run_at && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Last Run</span>
                          <span className="text-gray-300">
                            {formatRelativeTime(agent.last_run_at)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}
                      className="flex items-center justify-center w-full mt-4 pt-3 border-t border-white/10 text-gray-400 hover:text-white transition-colors"
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
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-5 bg-black/20">
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            Enabled Signals
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {(agent.signals_config?.enabled_signals || []).map((signal) => (
                              <span
                                key={signal}
                                className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 text-gray-300 rounded-lg text-sm"
                              >
                                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                                {formatSignalType(signal)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">
                            Configuration
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Min Score</span>
                              <span className="text-white">
                                {agent.signals_config?.min_score_threshold ?? 40}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Check Frequency</span>
                              <span className="text-white">
                                {agent.signals_config?.check_frequency_hours || 24}h
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Auto Queue</span>
                              <span className={agent.signals_config?.auto_queue ? 'text-[#10b981]' : 'text-gray-500'}>
                                {agent.signals_config?.auto_queue ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Auto Enrich</span>
                              <span className={agent.signals_config?.auto_enrich ? 'text-[#10b981]' : 'text-gray-500'}>
                                {agent.signals_config?.auto_enrich ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <button
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                            Edit Config
                          </button>
                          <button
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                          >
                            <Activity className="w-4 h-4" />
                            View Logs
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Modal Placeholder - Would be a separate component */}
      {showCreateModal && (
        <CreateAgentModal
          icpProfiles={icpProfiles}
          signalTypes={SIGNAL_TYPE_OPTIONS}
          onClose={() => setShowCreateModal(false)}
          onCreated={(agent) => {
            setAgents((prev) => [...prev, agent]);
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

// Create Agent Modal Component
interface CreateAgentModalProps {
  icpProfiles: IcpProfile[];
  signalTypes: { value: SignalType; label: string; description: string }[];
  onClose: () => void;
  onCreated: (agent: SignalsAgent) => void;
}

function CreateAgentModal({
  icpProfiles,
  signalTypes,
  onClose,
  onCreated,
}: CreateAgentModalProps) {
  const [name, setName] = useState('');
  const [icpProfileId, setIcpProfileId] = useState('');
  const [enabledSignals, setEnabledSignals] = useState<SignalType[]>(['post_engagement', 'job_change']);
  const [minScore, setMinScore] = useState(40);
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
          min_score_threshold: minScore,
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Create Signals Agent</h2>
          <p className="text-sm text-gray-400 mt-1">
            Set up a new agent to monitor lead activity
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Agent Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Enterprise SaaS Signals"
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#10b981]/50"
            />
          </div>

          {/* ICP Profile */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              ICP Profile *
            </label>
            <select
              value={icpProfileId}
              onChange={(e) => setIcpProfileId(e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10b981]/50"
            >
              <option value="">Select an ICP profile</option>
              {icpProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          {/* Signal Types */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Signals to Monitor *
            </label>
            <div className="grid grid-cols-1 gap-2">
              {signalTypes.map((signal) => (
                <button
                  key={signal.value}
                  type="button"
                  onClick={() => toggleSignal(signal.value)}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors text-left ${
                    enabledSignals.includes(signal.value)
                      ? 'bg-[#10b981]/20 border-[#10b981]/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      enabledSignals.includes(signal.value)
                        ? 'bg-[#10b981] text-black'
                        : 'bg-white/10 border border-white/20'
                    }`}
                  >
                    {enabledSignals.includes(signal.value) && (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{signal.label}</p>
                    <p className="text-sm text-gray-400">{signal.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Min Score */}
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Minimum Score Threshold
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-[#10b981]"
            />
            <div className="flex justify-between text-sm text-gray-400 mt-1">
              <span>0</span>
              <span className="text-[#10b981] font-medium">{minScore}</span>
              <span>100</span>
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoQueue}
                onChange={(e) => setAutoQueue(e.target.checked)}
                className="w-5 h-5 rounded bg-white/5 border-white/20 text-[#10b981] focus:ring-[#10b981]/50"
              />
              <div>
                <p className="text-white">Auto-queue high-score leads</p>
                <p className="text-sm text-gray-400">
                  Automatically add leads with signals to daily queue
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={autoEnrich}
                onChange={(e) => setAutoEnrich(e.target.checked)}
                className="w-5 h-5 rounded bg-white/5 border-white/20 text-[#10b981] focus:ring-[#10b981]/50"
              />
              <div>
                <p className="text-white">Auto-enrich emails</p>
                <p className="text-sm text-gray-400">
                  Automatically find emails for new leads
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Bot className="w-5 h-5" />
                  Create Agent
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignalsAgentsList;
