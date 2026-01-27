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
    <div className="p-5 bg-white/5 rounded-xl border border-white/10">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-gray-400">{label}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subValue && <p className="text-sm text-gray-500 mt-1">{subValue}</p>}
    </div>
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
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-emerald-600 flex items-center justify-center">
                <LineChart className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Insights</h1>
                <p className="text-sm text-gray-400">
                  Lead generation performance analytics
                </p>
              </div>
            </div>

            <button
              onClick={() => loadInsights()}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
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

            <div className="flex items-center gap-1 p-1 bg-white/5 rounded-lg">
              {[7, 14, 30].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    days === d
                      ? 'bg-[#10b981] text-black font-medium'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && !metrics ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => loadInsights()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
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
                  color="bg-[#10b981]/20 text-[#10b981]"
                />
                <MetricCard
                  icon={TrendingUp}
                  label="Avg Leads Per Day"
                  value={metrics.avg_leads_per_day.toFixed(1)}
                  color="bg-blue-500/20 text-blue-400"
                />
                <MetricCard
                  icon={Zap}
                  label="Active Signals"
                  value={metrics.active_signals}
                  color="bg-yellow-500/20 text-yellow-400"
                />
                <MetricCard
                  icon={BarChart3}
                  label="Avg Conversion Rate"
                  value={`${(metrics.avg_conversion_rate * 100).toFixed(1)}%`}
                  color="bg-purple-500/20 text-purple-400"
                />
              </div>
            )}

            {/* Daily Performance Table */}
            {dailyPerformance.length > 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    Daily Performance
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                        <th className="px-5 py-3">Agent</th>
                        {getDayHeaders().map((day) => (
                          <th key={day} className="px-3 py-3 text-center">
                            {day}
                          </th>
                        ))}
                        <th className="px-5 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {dailyPerformance.map((perf) => {
                        const total = perf.daily_counts.reduce((sum, d) => sum + d.count, 0);
                        return (
                          <tr key={perf.agent_id} className="hover:bg-white/5">
                            <td className="px-5 py-3">
                              <span className="font-medium text-white">
                                {perf.agent_name}
                              </span>
                            </td>
                            {perf.daily_counts.map((day) => (
                              <td key={day.date} className="px-3 py-3 text-center">
                                <span
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm ${
                                    day.count > 0
                                      ? 'bg-[#10b981]/20 text-[#10b981]'
                                      : 'bg-white/5 text-gray-500'
                                  }`}
                                >
                                  {day.count}
                                </span>
                              </td>
                            ))}
                            <td className="px-5 py-3 text-right">
                              <span className="font-bold text-white">{total}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Signals Performance */}
            {signalsPerformance.length > 0 && (
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Zap className="w-5 h-5 text-gray-400" />
                    Signals Performance
                  </h3>
                </div>
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      <th className="px-5 py-3">Signal</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3 text-right">Leads Generated</th>
                      <th className="px-5 py-3 text-right">% of Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {signalsPerformance.map((signal) => {
                      const colors = getSignalColors(signal.signal_type);
                      return (
                        <tr key={signal.signal_type} className="hover:bg-white/5">
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg ${colors.bg}`}>
                              <span className={`font-medium ${colors.text}`}>
                                {signal.signal_label}
                              </span>
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-400">
                            {formatSignalType(signal.signal_type)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <span className="font-medium text-white">
                              {signal.leads_generated.toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-16 h-2 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#10b981] rounded-full"
                                  style={{ width: `${signal.percentage}%` }}
                                />
                              </div>
                              <span className="text-gray-400 text-sm w-12 text-right">
                                {signal.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State */}
            {(!dailyPerformance.length && !signalsPerformance.length) && !loading && (
              <div className="flex flex-col items-center justify-center h-64">
                <LineChart className="w-12 h-12 text-gray-600 mb-4" />
                <p className="text-gray-400">No performance data available</p>
                <p className="text-sm text-gray-500 mt-1">
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
