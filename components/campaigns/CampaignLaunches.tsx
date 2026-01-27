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

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  running: { label: 'Running', color: 'text-green-400', bg: 'bg-green-500/20', icon: Play },
  paused: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Pause },
  completed: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Check },
  stopped: { label: 'Stopped', color: 'text-zinc-400', bg: 'bg-zinc-500/20', icon: Square },
  error: { label: 'Error', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (launches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Rocket className="w-12 h-12 mb-3 text-zinc-600" />
        <p className="font-medium">No launches yet</p>
        <p className="text-sm mt-1">Start your campaign to see launch history</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Launch History</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{launches.length} total launches</p>
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
            <div
              key={launch.id}
              className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl overflow-hidden hover:border-purple-500/30 transition-colors"
            >
              {/* Main row */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : launch.id)}
                className="w-full flex items-center gap-4 p-4 text-left"
              >
                <div className={`p-2.5 ${config.bg} rounded-xl`}>
                  <StatusIcon className={`w-5 h-5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-white">
                      {new Date(launch.started_at).toLocaleString()}
                    </p>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${config.bg} ${config.color}`}>
                      {config.label}
                    </span>
                    <span className="px-2 py-0.5 bg-white/5 text-zinc-400 rounded-full text-xs capitalize">
                      {launch.triggered_by}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-zinc-400">
                      {launch.contacts_processed}/{launch.total_contacts} contacts
                    </span>
                    <span className="text-sm text-zinc-500">•</span>
                    <span className="text-sm text-zinc-400">
                      {getDuration(launch.started_at, launch.ended_at)} duration
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-32">
                  <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        launch.status === 'running' 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                          : launch.status === 'error'
                          ? 'bg-red-500'
                          : 'bg-blue-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1 text-right">{progress.toFixed(0)}%</p>
                </div>

                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-zinc-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-zinc-400" />
                )}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 border-t border-zinc-700/50">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard
                      icon={Users}
                      label="Invitations Sent"
                      value={launch.invitations_sent}
                      color="text-blue-400"
                    />
                    <StatCard
                      icon={MessageSquare}
                      label="Messages Sent"
                      value={launch.messages_sent}
                      color="text-purple-400"
                    />
                    <StatCard
                      icon={Check}
                      label="Replies Received"
                      value={launch.replies_received}
                      color="text-emerald-400"
                    />
                    <StatCard
                      icon={AlertCircle}
                      label="Errors"
                      value={launch.errors}
                      color="text-red-400"
                    />
                  </div>

                  {launch.errors > 0 && (
                    <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">
                        {launch.errors} actions failed during this run. Check the logs for details.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
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
  <div className="p-3 bg-white/5 rounded-xl">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={`w-4 h-4 ${color}`} />
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
    <p className="text-xl font-bold text-white">{value}</p>
  </div>
);

export default CampaignLaunches;
