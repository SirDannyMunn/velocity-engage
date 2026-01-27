/**
 * CampaignScheduled - View scheduled and queued actions
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  MessageSquare,
  UserPlus,
  Mail,
  Pause,
  Play,
  Loader2,
  AlertCircle,
  MoreVertical,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import type { StepType } from '@engage/types/campaign-types';

interface CampaignScheduledProps {
  campaignId: string;
}

interface ScheduledAction {
  id: string;
  contact_name: string;
  contact_avatar?: string;
  contact_company?: string;
  step_type: StepType;
  step_name: string;
  scheduled_at: string;
  status: 'scheduled' | 'processing' | 'waiting';
}

const STEP_ICONS: Record<StepType, React.ElementType> = {
  invitation: UserPlus,
  message: MessageSquare,
  email: Mail,
  wait: Clock,
  condition: AlertCircle,
};

const STEP_COLORS: Record<StepType, { bg: string; text: string }> = {
  invitation: { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  message: { bg: 'bg-purple-500/20', text: 'text-purple-400' },
  email: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  wait: { bg: 'bg-zinc-500/20', text: 'text-zinc-400' },
  condition: { bg: 'bg-pink-500/20', text: 'text-pink-400' },
};

export const CampaignScheduled: React.FC<CampaignScheduledProps> = ({ campaignId }) => {
  const [actions, setActions] = useState<ScheduledAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<'time' | 'step'>('time');

  useEffect(() => {
    // Simulated data - replace with API call
    setLoading(true);
    setTimeout(() => {
      setActions([
        {
          id: '1',
          contact_name: 'Sarah Chen',
          contact_company: 'Stripe',
          step_type: 'invitation',
          step_name: 'Send Connection Request',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 15).toISOString(),
          status: 'scheduled',
        },
        {
          id: '2',
          contact_name: 'Mike Johnson',
          contact_company: 'Notion',
          step_type: 'message',
          step_name: 'Follow-up Message #1',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
          status: 'scheduled',
        },
        {
          id: '3',
          contact_name: 'Emily Rodriguez',
          contact_company: 'Linear',
          step_type: 'message',
          step_name: 'Follow-up Message #1',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
          status: 'waiting',
        },
        {
          id: '4',
          contact_name: 'David Kim',
          contact_company: 'Figma',
          step_type: 'invitation',
          step_name: 'Send Connection Request',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
          status: 'scheduled',
        },
        {
          id: '5',
          contact_name: 'Anna Peters',
          contact_company: 'Vercel',
          step_type: 'email',
          step_name: 'Email Follow-up',
          scheduled_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
          status: 'scheduled',
        },
      ]);
      setLoading(false);
    }, 500);
  }, [campaignId]);

  const getTimeLabel = (date: string) => {
    const diff = new Date(date).getTime() - Date.now();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `In ${minutes} min`;
    if (hours < 24) return `In ${hours}h`;
    return new Date(date).toLocaleDateString();
  };

  // Group actions by date
  const groupedByDate = actions.reduce((acc, action) => {
    const dateKey = new Date(action.scheduled_at).toDateString();
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(action);
    return acc;
  }, {} as Record<string, ScheduledAction[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (actions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
        <Calendar className="w-12 h-12 mb-3 text-zinc-600" />
        <p className="font-medium">No scheduled actions</p>
        <p className="text-sm mt-1">Actions will appear here when your campaign is running</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white">Scheduled Actions</h2>
          <p className="text-sm text-zinc-400 mt-0.5">{actions.length} actions queued</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedByDate).map(([date, dayActions]) => (
          <div key={date}>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Calendar className="w-4 h-4 text-purple-400" />
              </div>
              <h3 className="font-medium text-white">
                {new Date(date).toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric'
                })}
              </h3>
              <span className="text-sm text-zinc-500">({dayActions.length} actions)</span>
            </div>

            <div className="relative ml-5 pl-6 border-l-2 border-zinc-700 space-y-3">
              {dayActions.map((action) => {
                const Icon = STEP_ICONS[action.step_type];
                const colors = STEP_COLORS[action.step_type];
                
                return (
                  <div 
                    key={action.id}
                    className="relative flex items-center gap-4 p-4 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-xl group hover:border-purple-500/50 transition-all"
                  >
                    {/* Timeline dot */}
                    <div className="absolute -left-[33px] w-4 h-4 bg-zinc-900 border-2 border-zinc-700 rounded-full group-hover:border-purple-500 transition-colors" />
                    
                    {/* Step icon */}
                    <div className={`p-2.5 ${colors.bg} rounded-xl`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>

                    {/* Contact info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">{action.contact_name}</p>
                        {action.contact_company && (
                          <span className="text-sm text-zinc-500">at {action.contact_company}</span>
                        )}
                      </div>
                      <p className="text-sm text-zinc-400 mt-0.5">{action.step_name}</p>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span className="text-sm text-zinc-400">{getTimeLabel(action.scheduled_at)}</span>
                    </div>

                    {/* Status */}
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      action.status === 'processing' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : action.status === 'waiting'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {action.status === 'processing' && <Loader2 className="w-3 h-3 animate-spin mr-1 inline" />}
                      {action.status.charAt(0).toUpperCase() + action.status.slice(1)}
                    </span>

                    {/* Actions */}
                    <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CampaignScheduled;
