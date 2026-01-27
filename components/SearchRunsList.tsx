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
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { leadWatcherApi } from '../api/lead-watcher-api';
import { SearchRun, IcpProfile, SearchRunStatus } from '../types/lead-watcher-types';

// shadcn components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

// CVA variants
import { pageHeaderVariants, headerIconVariants, emptyStateVariants } from '../styles/variants';

interface SearchRunsListProps {
  onNavigate?: (page: string) => void;
}

const STATUS_CONFIG: Record<SearchRunStatus, { icon: React.ElementType; className: string; label: string }> = {
  pending: { icon: Clock, className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Pending' },
  running: { icon: Loader2, className: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Running' },
  completed: { icon: CheckCircle, className: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Completed' },
  failed: { icon: XCircle, className: 'bg-destructive/10 text-destructive border-destructive/20', label: 'Failed' },
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
      <div className={pageHeaderVariants()}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={headerIconVariants({ gradient: 'emerald' })}>
                <Search className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Search Runs</h1>
                <p className="text-sm text-muted-foreground">
                  Track Apify search runs and their results
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadRuns()}
              >
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>

              <Button
                onClick={handleCreateRun}
                disabled={creating || !selectedIcpId}
                className="gap-2"
              >
                {creating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                Run New Search
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={selectedIcpId || 'all'} onValueChange={(value: string) => setSelectedIcpId(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="All ICP Profiles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All ICP Profiles</SelectItem>
                {icpProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      {narrowingStats && (
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <div className="grid grid-cols-4 gap-4">
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">
                  {(narrowingStats.totals?.collected ?? narrowingStats.total_collected ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Collected</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold text-primary">
                  {(narrowingStats.totals?.retained ?? narrowingStats.total_retained ?? 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Retained as Leads</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">
                  {(narrowingStats.rates?.overall_conversion ?? narrowingStats.overall_conversion_rate ?? 0).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Conversion Rate</p>
              </CardContent>
            </Card>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <p className="text-2xl font-bold">
                  {(narrowingStats.rates?.strict_match ?? narrowingStats.strict_match_rate ?? 0).toFixed(1)}%
                </p>
                <p className="text-sm text-muted-foreground">Strict ICP Match</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading && runs.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadRuns()}>
              Retry
            </Button>
          </div>
        ) : runs.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Search className="w-12 h-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">No search runs yet</p>
            <p className="text-sm text-muted-foreground/70">
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
                        <Badge variant="outline" className={cn('gap-1.5', config.className)}>
                          <StatusIcon className={cn('w-3.5 h-3.5', run.status === 'running' && 'animate-spin')} />
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {run.icp_profile?.name || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {run.results_collected.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(run.results_filtered_non_lead + run.results_filtered_icp_mismatch).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-primary font-medium">
                          {run.results_retained.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        {run.conversion_rate !== null ? (
                          <span>{run.conversion_rate.toFixed(1)}%</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDuration(run.duration_seconds)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(run.started_at)}
                      </TableCell>
                      <TableCell>
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 text-muted-foreground transition-transform',
                            isExpanded && 'rotate-90'
                          )}
                        />
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={9}>
                          <div className="grid grid-cols-3 gap-6">
                            {/* Funnel */}
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                Conversion Funnel
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">Collected</span>
                                  <span className="font-medium">
                                    {run.results_collected.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">Non-lead Filtered</span>
                                  <span className="text-destructive">
                                    -{run.results_filtered_non_lead.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">ICP Mismatch</span>
                                  <span className="text-orange-500">
                                    -{run.results_filtered_icp_mismatch.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/30">
                                  <span className="text-primary">Retained</span>
                                  <span className="text-primary font-medium">
                                    {run.results_retained.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Strict vs Broad */}
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                Match Distribution
                              </h4>
                              {run.filter_stats?.strict_vs_broad ? (
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                    <span className="text-muted-foreground">Strict ICP Match</span>
                                    <span className="text-primary font-medium">
                                      {run.filter_stats.strict_vs_broad.strict_matches.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                    <span className="text-muted-foreground">Broad Match Only</span>
                                    <span className="text-yellow-500 font-medium">
                                      {run.filter_stats.strict_vs_broad.broad_only_matches.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-muted-foreground text-sm">No data available</p>
                              )}
                            </div>

                            {/* Lead Stats */}
                            <div>
                              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                                Lead Updates
                              </h4>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">New Leads Created</span>
                                  <span className="font-medium">
                                    {run.leads_created.toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                                  <span className="text-muted-foreground">Existing Updated</span>
                                  <span className="font-medium">
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
