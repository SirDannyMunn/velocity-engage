/**
 * Campaign Type Definitions
 * Types for the outreach campaign builder
 */

// ============================================================================
// Enums & Status Types
// ============================================================================

export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type StepType = 'invitation' | 'message' | 'email' | 'wait' | 'condition';
export type StepStatus = 'pending' | 'active' | 'completed' | 'skipped';
export type ContactCampaignStatus = 'queued' | 'in_progress' | 'replied' | 'completed' | 'failed' | 'unsubscribed';

export const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
  active: { label: 'Running', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  paused: { label: 'Paused', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  completed: { label: 'Completed', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  archived: { label: 'Archived', color: 'text-zinc-500', bg: 'bg-zinc-600/20' },
};

export const STEP_TYPE_CONFIG: Record<StepType, { label: string; icon: string; color: string }> = {
  invitation: { label: 'Send Invitation', icon: 'UserPlus', color: 'text-blue-400' },
  message: { label: 'Send Message', icon: 'MessageSquare', color: 'text-purple-400' },
  email: { label: 'Send Email', icon: 'Mail', color: 'text-cyan-400' },
  wait: { label: 'Wait', icon: 'Clock', color: 'text-amber-400' },
  condition: { label: 'Condition', icon: 'GitBranch', color: 'text-pink-400' },
};

// ============================================================================
// Core Entities
// ============================================================================

export interface CampaignStep {
  id: string;
  campaign_id: string;
  order: number;
  type: StepType;
  name: string;
  config: StepConfig;
  wait_days?: number;
  wait_hours?: number;
  stats: StepStats;
  created_at: string;
  updated_at: string;
}

export interface StepConfig {
  // For invitation step
  include_note?: boolean;
  note_template?: string;
  
  // For message step
  message_template?: string;
  use_ai_personalization?: boolean;
  ai_prompt?: string;
  
  // For email step
  subject_template?: string;
  body_template?: string;
  
  // For condition step
  condition_type?: 'accepted' | 'replied' | 'opened' | 'clicked';
  true_branch_step_id?: string;
  false_branch_step_id?: string;
  
  // For wait step
  wait_type?: 'fixed' | 'business_days';
}

export interface StepStats {
  total_contacts: number;
  pending: number;
  sent: number;
  accepted?: number;
  replied?: number;
  failed: number;
}

export interface Campaign {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  sender_account_id?: string;
  sender_account?: {
    id: string;
    name: string;
    email: string;
    status: string;
    avatar_url?: string;
  };
  input_source?: CampaignInputSource;
  steps?: CampaignStep[];
  settings?: CampaignSettings;
  stats?: CampaignStats;
  started_at?: string;
  paused_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignInputSource {
  type: 'agent' | 'icp_profile' | 'lead_list' | 'manual';
  agent_ids?: string[];
  icp_profile_ids?: string[];
  lead_list_id?: string;
  lead_ids?: string[];
  filters?: {
    min_score?: number;
    signal_types?: string[];
    statuses?: string[];
  };
}

export interface CampaignSettings {
  // Daily limits
  max_invitations_per_day: number;
  max_messages_per_day: number;
  
  // Timezone
  timezone: string;
  
  // Send window
  send_window_start: string; // "09:00"
  send_window_end: string;   // "17:00"
  send_days: string[];       // ['monday', 'tuesday', ...]
  
  // Stop conditions
  stop_on_reply: boolean;
  stop_on_negative_reply: boolean;
  skip_already_connected: boolean;
  
  // Humanization
  delay_between_actions_min: number; // seconds
  delay_between_actions_max: number; // seconds
  
  // Notifications
  notify_on_reply: boolean;
  daily_summary_email: boolean;
}

export interface CampaignStats {
  total_contacts: number;
  in_queue: number;
  in_progress: number;
  completed: number;
  replied: number;
  positive_replies: number;
  negative_replies: number;
  failed: number;
  unsubscribed: number;
  // Calculated rates
  reply_rate: number;
  acceptance_rate: number;
  positive_rate: number;
}

export interface CampaignContact {
  id: string;
  campaign_id: string;
  lead_id: string;
  lead: {
    id: string;
    display_name: string;
    headline?: string;
    company_name?: string;
    profile_url?: string;
    avatar_url?: string;
  };
  status: ContactCampaignStatus;
  current_step_id?: string;
  current_step_order?: number;
  last_action_at?: string;
  replied_at?: string;
  reply_sentiment?: 'positive' | 'neutral' | 'negative';
  error_message?: string;
  step_history: ContactStepHistory[];
  added_at: string;
}

export interface ContactStepHistory {
  step_id: string;
  step_type: StepType;
  status: 'sent' | 'failed' | 'skipped';
  sent_at?: string;
  message_sent?: string;
  error?: string;
}

export interface CampaignInsights {
  campaign_id: string;
  period: 'day' | 'week' | 'month' | 'all';
  summary: {
    total_sent: number;
    total_replies: number;
    reply_rate: number;
    avg_response_time_hours: number;
    best_performing_step: string;
  };
  daily_stats: DailyStats[];
  step_performance: StepPerformance[];
  reply_analysis: {
    positive: number;
    neutral: number;
    negative: number;
    keywords: { word: string; count: number }[];
  };
}

export interface DailyStats {
  date: string;
  invitations_sent: number;
  messages_sent: number;
  replies_received: number;
  connections_accepted: number;
}

export interface StepPerformance {
  step_id: string;
  step_name: string;
  step_type: StepType;
  sent: number;
  replied: number;
  reply_rate: number;
}

// ============================================================================
// AI Message Generation
// ============================================================================

export interface AIMessageRequest {
  lead_id: string;
  campaign_id?: string;
  step_type: 'invitation' | 'initial_dm' | 'followup';
  context?: {
    previous_messages?: string[];
    intent_signals?: string[];
    custom_instructions?: string;
  };
}

export interface AIMessageResponse {
  message: string;
  word_count: number;
  personalization_used: string[];
  alternatives?: string[];
}

export interface MessageTemplate {
  id: string;
  organization_id: string;
  name: string;
  type: 'invitation' | 'message' | 'email';
  subject?: string;
  body: string;
  variables: string[];
  is_ai_generated: boolean;
  usage_count: number;
  reply_rate?: number;
  created_at: string;
}

// ============================================================================
// Form Data
// ============================================================================

export interface CampaignFormData {
  name: string;
  description?: string;
  sender_account_id?: string;
  icp_profile_id?: string;
  linkedin_account_id?: string;
  input_source?: CampaignInputSource;
  settings?: Partial<CampaignSettings>;
}

export interface StepFormData {
  type: StepType;
  name: string;
  config: StepConfig;
  wait_days?: number;
  wait_hours?: number;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface CampaignsListResponse {
  data: Campaign[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface CampaignResponse {
  data: Campaign;
}

export interface CampaignContactsResponse {
  data: CampaignContact[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

// Default values
export const DEFAULT_CAMPAIGN_SETTINGS: CampaignSettings = {
  max_invitations_per_day: 25,
  max_messages_per_day: 50,
  timezone: 'America/New_York',
  send_window_start: '09:00',
  send_window_end: '17:00',
  send_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  stop_on_reply: true,
  stop_on_negative_reply: true,
  skip_already_connected: true,
  delay_between_actions_min: 60,
  delay_between_actions_max: 180,
  notify_on_reply: true,
  daily_summary_email: false,
};

export const DEFAULT_STEP_STATS: StepStats = {
  total_contacts: 0,
  pending: 0,
  sent: 0,
  replied: 0,
  failed: 0,
};
