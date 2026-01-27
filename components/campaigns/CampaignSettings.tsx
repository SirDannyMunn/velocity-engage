/**
 * CampaignSettings - Campaign configuration and preferences
 */

import React, { useState, useEffect } from 'react';
import {
  Save,
  Clock,
  Calendar,
  AlertTriangle,
  MessageSquare,
  Settings,
  Bell,
  Pause,
  Loader2,
  ToggleLeft,
  ToggleRight,
  Info,
} from 'lucide-react';
import type { CampaignSettings as SettingsType, Campaign } from '@engage/types/campaign-types';
import { DEFAULT_CAMPAIGN_SETTINGS } from '@engage/types/campaign-types';
import { campaignApi } from '@engage/api/campaign-api';

interface CampaignSettingsProps {
  campaign: Campaign;
  onUpdate: (campaign: Campaign) => void;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const CampaignSettings: React.FC<CampaignSettingsProps> = ({ campaign, onUpdate }) => {
  const [settings, setSettings] = useState<SettingsType>({ ...DEFAULT_CAMPAIGN_SETTINGS, ...campaign.settings });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setSettings({ ...DEFAULT_CAMPAIGN_SETTINGS, ...campaign.settings });
    setHasChanges(false);
  }, [campaign]);

  const updateSetting = <K extends keyof SettingsType>(key: K, value: SettingsType[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await campaignApi.updateCampaign(campaign.id, { settings });
      onUpdate(response.data);
      setHasChanges(false);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Daily Limits */}
        <SettingSection
          icon={MessageSquare}
          title="Daily Limits"
          description="Control how many actions are performed each day"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Invitations per day</label>
              <input
                type="number"
                value={settings.max_invitations_per_day}
                onChange={(e) => updateSetting('max_invitations_per_day', parseInt(e.target.value) || 0)}
                min={1}
                max={100}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-1">LinkedIn recommends 50-100/day</p>
            </div>
            <div>
              <label className="block text-sm text-zinc-400 mb-2">Messages per day</label>
              <input
                type="number"
                value={settings.max_messages_per_day}
                onChange={(e) => updateSetting('max_messages_per_day', parseInt(e.target.value) || 0)}
                min={1}
                max={150}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-zinc-500 mt-1">Stay under 150 for safety</p>
            </div>
          </div>
        </SettingSection>

        {/* Send Window */}
        <SettingSection
          icon={Clock}
          title="Send Window"
          description="Only send messages during these hours (recipient's timezone)"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">Start Time</label>
              <input
                type="time"
                value={settings.send_window_start}
                onChange={(e) => updateSetting('send_window_start', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">End Time</label>
              <input
                type="time"
                value={settings.send_window_end}
                onChange={(e) => updateSetting('send_window_end', e.target.value)}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </SettingSection>

        {/* Active Days */}
        <SettingSection
          icon={Calendar}
          title="Active Days"
          description="Days when the campaign will run"
        >
          <div className="flex flex-wrap gap-2">
            {DAYS.map((day) => {
              const isActive = settings.send_days.includes(day.toLowerCase());
              return (
                <button
                  key={day}
                  onClick={() => {
                    const dayLower = day.toLowerCase();
                    const newDays = isActive
                      ? settings.send_days.filter(d => d !== dayLower)
                      : [...settings.send_days, dayLower];
                    updateSetting('send_days', newDays);
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              );
            })}
          </div>
        </SettingSection>

        {/* Stop Conditions */}
        <SettingSection
          icon={Pause}
          title="Stop Conditions"
          description="Automatically pause the campaign when conditions are met"
        >
          <div className="space-y-4">
            <Toggle
              label="Stop on reply"
              description="Stop contacting a lead when they reply"
              checked={settings.stop_on_reply}
              onChange={(v) => updateSetting('stop_on_reply', v)}
            />
            <Toggle
              label="Stop on negative reply"
              description="Stop if reply sentiment is detected as negative"
              checked={settings.stop_on_negative_reply}
              onChange={(v) => updateSetting('stop_on_negative_reply', v)}
            />
            <Toggle
              label="Skip already connected"
              description="Don't send invitations to existing connections"
              checked={settings.skip_already_connected}
              onChange={(v) => updateSetting('skip_already_connected', v)}
            />
          </div>
        </SettingSection>

        {/* Random Delays */}
        <SettingSection
          icon={Clock}
          title="Humanization"
          description="Add random delays to appear more natural"
        >
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">Min delay between actions (seconds)</label>
              <input
                type="number"
                value={settings.delay_between_actions_min}
                onChange={(e) => updateSetting('delay_between_actions_min', parseInt(e.target.value) || 0)}
                min={30}
                max={300}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">Max delay (seconds)</label>
              <input
                type="number"
                value={settings.delay_between_actions_max}
                onChange={(e) => updateSetting('delay_between_actions_max', parseInt(e.target.value) || 0)}
                min={60}
                max={600}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </SettingSection>

        {/* Notifications */}
        <SettingSection
          icon={Bell}
          title="Notifications"
          description="Get notified about important events"
        >
          <div className="space-y-4">
            <Toggle
              label="Email on reply"
              description="Send email when a lead replies"
              checked={settings.notify_on_reply}
              onChange={(v) => updateSetting('notify_on_reply', v)}
            />
            <Toggle
              label="Daily summary"
              description="Receive a daily performance summary"
              checked={settings.daily_summary_email}
              onChange={(v) => updateSetting('daily_summary_email', v)}
            />
          </div>
        </SettingSection>

        {/* Save Button */}
        {hasChanges && (
          <div className="sticky bottom-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-medium shadow-lg hover:shadow-purple-500/25 transition-all disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Setting Section Wrapper
interface SettingSectionProps {
  icon: React.ElementType;
  title: string;
  description: string;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ icon: Icon, title, description, children }) => (
  <div className="p-5 bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 rounded-2xl">
    <div className="flex items-start gap-3 mb-4">
      <div className="p-2 bg-purple-500/20 rounded-xl">
        <Icon className="w-5 h-5 text-purple-400" />
      </div>
      <div>
        <h3 className="font-semibold text-white">{title}</h3>
        <p className="text-sm text-zinc-400 mt-0.5">{description}</p>
      </div>
    </div>
    {children}
  </div>
);

// Toggle Component
interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
    <div>
      <p className="font-medium text-white text-sm">{label}</p>
      <p className="text-xs text-zinc-500">{description}</p>
    </div>
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-11 h-6 rounded-full transition-colors ${
        checked ? 'bg-purple-500' : 'bg-zinc-600'
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

export default CampaignSettings;
