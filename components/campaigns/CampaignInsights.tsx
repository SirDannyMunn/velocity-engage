/**
 * CampaignInsights - Analytics and performance metrics
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  MessageSquare,
  UserPlus,
  Check,
  Clock,
  Target,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
} from 'lucide-react';
import type { CampaignInsights as InsightsType, DailyStats, StepPerformance } from '@engage/types/campaign-types';
import { campaignApi } from '@engage/api/campaign-api';

interface CampaignInsightsProps {
  campaignId: string;
}

export const CampaignInsights: React.FC<CampaignInsightsProps> = ({ campaignId }) => {
  const [insights, setInsights] = useState<InsightsType | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('week');

  useEffect(() => {
    loadInsights();
  }, [campaignId, period]);

  const loadInsights = async () => {
    try {
      setLoading(true);
      const response = await campaignApi.getInsights(campaignId, period);
      setInsights(response.insights);
    } catch (err) {
      console.error('Failed to load insights:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (!insights) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <BarChart3 className="w-12 h-12 mb-3 text-zinc-600" />
        <p className="font-medium">No insights available</p>
        <p className="text-sm mt-1">Start your campaign to see analytics</p>
      </div>
    );
  }

  const { summary, daily_stats, step_performance, reply_analysis } = insights;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Campaign Performance</h2>
        <div className="flex items-center gap-2 bg-zinc-800 rounded-lg p-1">
          {(['day', 'week', 'month', 'all'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                period === p
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {p === 'all' ? 'All Time' : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Messages Sent"
          value={summary.total_sent}
          icon={MessageSquare}
          color="text-blue-400"
          bgColor="bg-blue-500/20"
        />
        <MetricCard
          label="Replies Received"
          value={summary.total_replies}
          icon={Check}
          color="text-emerald-400"
          bgColor="bg-emerald-500/20"
        />
        <MetricCard
          label="Reply Rate"
          value={`${summary.reply_rate.toFixed(1)}%`}
          icon={Target}
          color="text-purple-400"
          bgColor="bg-purple-500/20"
          trend={summary.reply_rate > 25 ? 'up' : summary.reply_rate < 10 ? 'down' : undefined}
        />
        <MetricCard
          label="Avg Response Time"
          value={`${summary.avg_response_time_hours.toFixed(1)}h`}
          icon={Clock}
          color="text-amber-400"
          bgColor="bg-amber-500/20"
        />
      </div>

      {/* Performance Chart */}
      <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl">
        <h3 className="font-semibold text-white mb-4">Daily Activity</h3>
        <div className="h-64 flex items-end gap-2">
          {daily_stats.map((day, idx) => {
            const maxValue = Math.max(...daily_stats.map(d => d.invitations_sent + d.messages_sent + d.replies_received)) || 1;
            const total = day.invitations_sent + day.messages_sent;
            const height = (total / maxValue) * 100;
            const replyHeight = (day.replies_received / maxValue) * 100;
            
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center" style={{ height: '200px' }}>
                  <div 
                    className="w-full bg-purple-500/30 rounded-t-lg transition-all hover:bg-purple-500/50"
                    style={{ height: `${height}%`, minHeight: total > 0 ? '4px' : '0' }}
                  />
                  <div 
                    className="w-full bg-emerald-500/50 rounded-b-lg transition-all hover:bg-emerald-500/70"
                    style={{ height: `${replyHeight}%`, minHeight: day.replies_received > 0 ? '4px' : '0' }}
                  />
                </div>
                <span className="text-xs text-zinc-500 mt-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-purple-500/50" />
            <span className="text-xs text-zinc-400">Messages Sent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500/50" />
            <span className="text-xs text-zinc-400">Replies</span>
          </div>
        </div>
      </div>

      {/* Step Performance */}
      <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl">
        <h3 className="font-semibold text-white mb-4">Step Performance</h3>
        <div className="space-y-3">
          {step_performance.map((step, idx) => (
            <div key={step.step_id} className="flex items-center gap-4 p-3 bg-white/5 rounded-xl">
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-sm font-medium text-purple-400">
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{step.step_name}</p>
                <p className="text-xs text-zinc-500 capitalize">{step.step_type}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-white">{step.sent} sent</p>
                <p className="text-xs text-emerald-400">{step.replied} replies ({step.reply_rate.toFixed(1)}%)</p>
              </div>
              <div className="w-24">
                <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                    style={{ width: `${step.reply_rate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sentiment Breakdown */}
        <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl">
          <h3 className="font-semibold text-white mb-4">Reply Sentiment</h3>
          <div className="space-y-4">
            <SentimentBar label="Positive" value={reply_analysis.positive} total={summary.total_replies} color="bg-emerald-500" />
            <SentimentBar label="Neutral" value={reply_analysis.neutral} total={summary.total_replies} color="bg-zinc-500" />
            <SentimentBar label="Negative" value={reply_analysis.negative} total={summary.total_replies} color="bg-red-500" />
          </div>
        </div>

        {/* Top Keywords */}
        <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl">
          <h3 className="font-semibold text-white mb-4">Common Reply Keywords</h3>
          <div className="flex flex-wrap gap-2">
            {reply_analysis.keywords.slice(0, 12).map((kw, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 bg-white/5 text-zinc-300 rounded-lg text-sm border border-white/10"
              >
                {kw.word} <span className="text-zinc-500">({kw.count})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Metric Card Component
interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  trend?: 'up' | 'down';
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, icon: Icon, color, bgColor, trend }) => (
  <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl">
    <div className="flex items-start justify-between mb-3">
      <div className={`p-2.5 ${bgColor} rounded-xl`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      {trend && (
        <span className={`flex items-center text-xs ${trend === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <p className="text-sm text-zinc-400 mt-1">{label}</p>
  </div>
);

// Sentiment Bar Component
const SentimentBar: React.FC<{ label: string; value: number; total: number; color: string }> = ({ 
  label, value, total, color 
}) => {
  const percent = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <span className="text-zinc-400">{label}</span>
        <span className="text-white font-medium">{value} ({percent.toFixed(0)}%)</span>
      </div>
      <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
};

export default CampaignInsights;
