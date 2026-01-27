/**
 * SearchRunsList Component
 * Table of search runs with status, results, and conversion rate
 */

import { useState, useEffect, useCallback, Fragment } from 'react';
import {
  Search,
  Play,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  Filter as FilterIcon,
  Target,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import { SearchRun, IcpProfile, SearchRunStatus } from '../types/lead-watcher-types';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

interface SearchRunsListProps {
  onNavigate?: (page: string) => void;
}

const STATUS_CONFIG: Record<SearchRunStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-yellow-400 bg-yellow-500/10', label: 'Pending' },
  running: { icon: Loader2, color: 'text-blue-400 bg-blue-500/10', label: 'Running' },
  completed: { icon: CheckCircle, color: 'text-green-400 bg-green-500/10', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-400 bg-red-500/10', label: 'Failed' },
};

export function SearchRunsList({ onNavigate }: SearchRunsListProps) {
  const [runs, setRuns] = useState<SearchRun[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IcpProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIcpId, setSelectedIcpId] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);
  const [narrowingStats, setNarrowingStats] = useState<any>(null);

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { per_page: 50 };
      if (selectedIcpId) {
        params.icp_profile_id = selectedIcpId;
      }
      const response = await leadWatcherApi.listSearchRuns(params);
      setRuns(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load search runs');
      setRuns([]);
    } finally {
      setLoading(false);
    }
  }, [selectedIcpId]);

  const loadIcpProfiles = useCallback(async () => {
    try {
      const response = await leadWatcherApi.listIcpProfiles();
      setIcpProfiles(response.data);
    } catch (err) {
      console.error('Failed to load ICP profiles:', err);
    }
  }, []);

  const loadNarrowingStats = useCallback(async () => {
    try {
      const params: any = {};
      if (selectedIcpId) {
        params.icp_profile_id = selectedIcpId;
      }
      const response = await leadWatcherApi.getNarrowingStats(params);
      setNarrowingStats(response.data);
    } catch (err) {
      console.error('Failed to load narrowing stats:', err);
    }
  }, [selectedIcpId]);

  useEffect(() => {
    loadIcpProfiles();
  }, [loadIcpProfiles]);

  useEffect(() => {
    loadRuns();
    loadNarrowingStats();
  }, [loadRuns, loadNarrowingStats]);

  const handleCreateRun = async () => {
    if (!selectedIcpId) {
      setError('Please select an ICP profile first');
      return;
    }
    setCreating(true);
    try {
      await leadWatcherApi.createSearchRun({ icp_profile_id: selectedIcpId });
      await loadRuns();
    } catch (err: any) {
      setError(err.message || 'Failed to create search run');
    } finally {
      setCreating(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-emerald-600 flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Search Runs</h1>
                <p className="text-sm text-gray-400">
                  Track Apify search runs and their results
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadRuns()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleCreateRun}
                disabled={creating || !selectedIcpId}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Run New Search
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <select
              value={selectedIcpId}
              onChange={(e) => setSelectedIcpId(e.target.value)}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#10b981]/50"
            >
              <option value="">All ICP Profiles</option>
              {icpProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {narrowingStats && (
        <div className="px-6 py-4 border-b border-[var(--charcoal)] bg-[var(--void-black)]/30">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-[var(--charcoal)]/30 rounded-xl">
              <p className="text-2xl font-bold text-white">
                {(narrowingStats.totals?.collected ?? narrowingStats.total_collected ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-[var(--steel-gray)]">Total Collected</p>
            </div>
            <div className="p-4 bg-[var(--charcoal)]/30 rounded-xl">
              <p className="text-2xl font-bold text-[var(--neon-lime)]">
                {(narrowingStats.totals?.retained ?? narrowingStats.total_retained ?? 0).toLocaleString()}
              </p>
              <p className="text-sm text-[var(--steel-gray)]">Retained as Leads</p>
            </div>
            <div className="p-4 bg-[var(--charcoal)]/30 rounded-xl">
              <p className="text-2xl font-bold text-white">
                {(narrowingStats.rates?.overall_conversion ?? narrowingStats.overall_conversion_rate ?? 0).toFixed(1)}%
              </p>
              <p className="text-sm text-[var(--steel-gray)]">Conversion Rate</p>
            </div>
            <div className="p-4 bg-[var(--charcoal)]/30 rounded-xl">
              <p className="text-2xl font-bold text-white">
                {(narrowingStats.rates?.strict_match ?? narrowingStats.strict_match_rate ?? 0).toFixed(1)}%
              </p>
              <p className="text-sm text-[var(--steel-gray)]">Strict ICP Match</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && runs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => loadRuns()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Search className="w-12 h-12 text-gray-600" />
            <p className="text-gray-400">No search runs yet</p>
            <p className="text-sm text-gray-500">
              Select an ICP profile and run a new search
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>ICP Profile</TableHead>
                <TableHead>Collected</TableHead>
                <TableHead>Filtered</TableHead>
                <TableHead>Retained</TableHead>
                <TableHead>Conversion</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Started</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runs.map((run) => {
                const config = STATUS_CONFIG[run.status];
                const StatusIcon = config.icon;
                const isExpanded = expandedRunId === run.id;

                return (
                  <Fragment key={run.id}>
                    <TableRow
                      onClick={() => setExpandedRunId(isExpanded ? null : run.id)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${config.color}`}>
                          <StatusIcon className={`w-4 h-4 ${run.status === 'running' ? 'animate-spin' : ''}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-white font-medium">
                          {run.icp_profile?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-gray-300">
                        {run.results_collected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-[var(--steel-gray)]">
                        {(run.results_filtered_non_lead + run.results_filtered_icp_mismatch).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-[var(--neon-lime)] font-medium">
                          {run.results_retained.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {run.conversion_rate !== null ? (
                          <span className="text-white">
                            {run.conversion_rate.toFixed(1)}%
                          </span>
                        ) : (
                          <span className="text-[var(--steel-gray)]">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-[var(--steel-gray)]">
                        {formatDuration(run.duration_seconds)}
                      </TableCell>
                      <TableCell className="text-[var(--steel-gray)] text-sm">
                        {formatDate(run.started_at)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className={`w-4 h-4 text-[var(--steel-gray)] transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-[var(--charcoal)]/30">
                        <TableCell colSpan={9}>
                          <div className="grid grid-cols-3 gap-6">
                            {/* Funnel */}
                            <div>
                              <h4 className="text-sm font-medium text-[var(--steel-gray)] mb-3">
                                Conversion Funnel
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                  <span className="text-gray-300">Collected</span>
                                  <span className="text-white font-medium">
                                    {run.results_collected.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                  <span className="text-gray-300">Non-lead Filtered</span>
                                  <span className="text-red-400">
                                    -{run.results_filtered_non_lead.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                  <span className="text-gray-300">ICP Mismatch</span>
                                  <span className="text-orange-400">
                                    -{run.results_filtered_icp_mismatch.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-[var(--neon-lime)]/10 rounded-lg border border-[var(--neon-lime)]/30">
                                  <span className="text-[var(--neon-lime)]">Retained</span>
                                  <span className="text-[var(--neon-lime)] font-medium">
                                    {run.results_retained.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Strict vs Broad */}
                            <div>
                              <h4 className="text-sm font-medium text-[var(--steel-gray)] mb-3">
                                Match Distribution
                              </h4>
                              {run.filter_stats?.strict_vs_broad ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                    <span className="text-gray-300">Strict ICP Match</span>
                                    <span className="text-[var(--neon-lime)] font-medium">
                                      {run.filter_stats.strict_vs_broad.strict_matches.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                    <span className="text-gray-300">Broad Match Only</span>
                                    <span className="text-yellow-400 font-medium">
                                      {run.filter_stats.strict_vs_broad.broad_only_matches.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[var(--steel-gray)] text-sm">No data available</p>
                              )}
                            </div>

                            {/* Lead Stats */}
                            <div>
                              <h4 className="text-sm font-medium text-[var(--steel-gray)] mb-3">
                                Lead Updates
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                  <span className="text-gray-300">New Leads Created</span>
                                  <span className="text-white font-medium">
                                    {run.leads_created.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-[var(--void-black)]/50 rounded-lg">
                                  <span className="text-gray-300">Existing Updated</span>
                                  <span className="text-white font-medium">
                                    {run.leads_updated.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

export default SearchRunsList;
