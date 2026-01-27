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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/components/ui/utils';

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
            <div className="space-y-2">
              <Label>Invitations per day</Label>
              <Input
                type="number"
                value={settings.max_invitations_per_day}
                onChange={(e) => updateSetting('max_invitations_per_day', parseInt(e.target.value) || 0)}
                min={1}
                max={100}
              />
              <p className="text-xs text-muted-foreground">LinkedIn recommends 50-100/day</p>
            </div>
            <div className="space-y-2">
              <Label>Messages per day</Label>
              <Input
                type="number"
                value={settings.max_messages_per_day}
                onChange={(e) => updateSetting('max_messages_per_day', parseInt(e.target.value) || 0)}
                min={1}
                max={150}
              />
              <p className="text-xs text-muted-foreground">Stay under 150 for safety</p>
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
            <div className="flex-1 space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={settings.send_window_start}
                onChange={(e) => updateSetting('send_window_start', e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={settings.send_window_end}
                onChange={(e) => updateSetting('send_window_end', e.target.value)}
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
                <Button
                  key={day}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    const dayLower = day.toLowerCase();
                    const newDays = isActive
                      ? settings.send_days.filter(d => d !== dayLower)
                      : [...settings.send_days, dayLower];
                    updateSetting('send_days', newDays);
                  }}
                >
                  {day.slice(0, 3)}
                </Button>
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
            <div className="flex-1 space-y-2">
              <Label>Min delay between actions (seconds)</Label>
              <Input
                type="number"
                value={settings.delay_between_actions_min}
                onChange={(e) => updateSetting('delay_between_actions_min', parseInt(e.target.value) || 0)}
                min={30}
                max={300}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Max delay (seconds)</Label>
              <Input
                type="number"
                value={settings.delay_between_actions_max}
                onChange={(e) => updateSetting('delay_between_actions_max', parseInt(e.target.value) || 0)}
                min={60}
                max={600}
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
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Save className="w-5 h-5 mr-2" />
              )}
              Save Changes
            </Button>
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
  <Card>
    <CardContent className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 bg-primary/20 rounded-xl">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </CardContent>
  </Card>
);

// Toggle Component
interface ToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
    <div>
      <p className="font-medium text-foreground text-sm">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

export default CampaignSettings;
