/**
 * LeadInsights Component
 * Analytics dashboard with metrics and performance tables
 */

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Users,
  Zap,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  InsightsMetrics,
  DailyPerformance,
  SignalPerformance,
  IcpProfile,
  getSignalColors,
  formatSignalType,
} from '../types/lead-watcher-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
import { cn } from '@/components/ui/utils';
import {
  pageHeaderVariants,
  headerIconVariants,
  emptyStateVariants,
} from '../styles/variants';

interface LeadInsightsProps {
  onNavigate?: (page: string) => void;
}

export function LeadInsights({ onNavigate }: LeadInsightsProps) {
  const [metrics, setMetrics] = useState<InsightsMetrics | null>(null);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>([]);
  const [signalsPerformance, setSignalsPerformance] = useState<SignalPerformance[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IcpProfile[]>([]);
  const [selectedIcpId, setSelectedIcpId] = useState<string>('');
  const [days, setDays] = useState(7);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = { days };
      if (selectedIcpId) {
        params.icp_profile_id = selectedIcpId;
      }
      
      const response = await leadWatcherApi.getFullInsights(params);
      setMetrics(response.data.metrics);
      setDailyPerformance(response.data.daily_performance);
      setSignalsPerformance(response.data.signals_performance);
    } catch (err: any) {
      setError(err.message || 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [selectedIcpId, days]);

  const loadIcpProfiles = useCallback(async () => {
    try {
      const response = await leadWatcherApi.listIcpProfiles();
      setIcpProfiles(response.data);
    } catch (err) {
      console.error('Failed to load ICP profiles:', err);
    }
  }, []);

  useEffect(() => {
    loadIcpProfiles();
  }, [loadIcpProfiles]);

  useEffect(() => {
    loadInsights();
  }, [loadInsights]);

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    subValue,
    color,
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subValue?: string;
    color: string;
  }) => (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="text-3xl font-bold">{value}</p>
        {subValue && <p className="text-sm text-muted-foreground/60 mt-1">{subValue}</p>}
      </CardContent>
    </Card>
  );

  // Generate last N days for headers
  const getDayHeaders = () => {
    const headers: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      headers.push(date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }));
    }
    return headers;
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className={pageHeaderVariants()}>
              <div className={headerIconVariants()}>
                <LineChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Insights</h1>
                <p className="text-sm text-muted-foreground">
                  Lead generation performance analytics
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={() => loadInsights()}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <Select value={selectedIcpId || 'all'} onValueChange={(value) => setSelectedIcpId(value === 'all' ? '' : value)}>
              <SelectTrigger className="w-64">
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

            <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
              {[7, 14, 30].map((d) => (
                <Button
                  key={d}
                  variant={days === d ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setDays(d)}
                >
                  {d}d
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && !metrics ? (
          <div className={emptyStateVariants({ className: 'h-64' })}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className={emptyStateVariants({ className: 'h-64 gap-4' })}>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadInsights()}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Metrics Grid */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                  icon={Users}
                  label="Total Leads Generated"
                  value={metrics.total_leads_generated.toLocaleString()}
                  subValue={`Last ${days} days`}
                  color="bg-primary/20 text-primary"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Avg Leads Per Day"
                  value={metrics.avg_leads_per_day.toFixed(1)}
                  color="bg-blue-500/20 text-blue-500"
                />
                <MetricCard
                  icon={Zap}
                  label="Active Signals"
                  value={metrics.active_signals}
                  color="bg-yellow-500/20 text-yellow-500"
                />
                <MetricCard
                  icon={BarChart3}
                  label="Avg Conversion Rate"
                  value={`${(metrics.avg_conversion_rate * 100).toFixed(1)}%`}
                  color="bg-purple-500/20 text-purple-500"
                />
              </div>
            )}

            {/* Daily Performance Table */}
            {dailyPerformance.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    Daily Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          {getDayHeaders().map((day) => (
                            <TableHead key={day} className="text-center">
                              {day}
                            </TableHead>
                          ))}
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dailyPerformance.map((perf) => {
                          const total = perf.daily_counts.reduce((sum, d) => sum + d.count, 0);
                          return (
                            <TableRow key={perf.agent_id}>
                              <TableCell className="font-medium">
                                {perf.agent_name}
                              </TableCell>
                              {perf.daily_counts.map((day) => (
                                <TableCell key={day.date} className="text-center">
                                  <span
                                    className={cn(
                                      'inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm',
                                      day.count > 0
                                        ? 'bg-primary/20 text-primary'
                                        : 'bg-muted text-muted-foreground'
                                    )}
                                  >
                                    {day.count}
                                  </span>
                                </TableCell>
                              ))}
                              <TableCell className="text-right font-bold">
                                {total}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Signals Performance */}
            {signalsPerformance.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="w-5 h-5 text-muted-foreground" />
                    Signals Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Signal</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Leads Generated</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {signalsPerformance.map((signal) => {
                        const colors = getSignalColors(signal.signal_type);
                        return (
                          <TableRow key={signal.signal_type}>
                            <TableCell>
                              <span className={cn('inline-flex items-center gap-2 px-2.5 py-1 rounded-lg', colors.bg)}>
                                <span className={cn('font-medium', colors.text)}>
                                  {signal.signal_label}
                                </span>
                              </span>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatSignalType(signal.signal_type)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {signal.leads_generated.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Progress value={signal.percentage} className="w-16 h-2" />
                                <span className="text-muted-foreground text-sm w-12 text-right">
                                  {signal.percentage.toFixed(1)}%
                                </span>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Empty State */}
            {(!dailyPerformance.length && !signalsPerformance.length) && !loading && (
              <div className={emptyStateVariants({ className: 'h-64' })}>
                <LineChart className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No performance data available</p>
                <p className="text-sm text-muted-foreground/60 mt-1">
                  Start running search agents to see analytics
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LeadInsights;
