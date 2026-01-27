/**
 * Lead Watcher Type Definitions
 * TypeScript types for the Lead Watcher AI-powered lead discovery system
 */

// ============================================================================
// Enums & String Literal Types
// ============================================================================

export type LeadStatus = 'new' | 'reviewing' | 'shortlisted' | 'archived';

export type SignalType =
  | 'commented_interest'
  | 'pain_point_complaint'
  | 'engaged_competitor'
  | 'engaged_influencer'
  | 'high_activity_spike'
  | 'job_change'
  | 'top_5_percent'
  | 'recently_raised_funds'
  | 'post_engagement'
  | 'comment'
  | 'company_growth'
  | 'content_publish'
  | 'connection_request'
  | 'mention';

export type InteractionType = 'like' | 'comment' | 'repost' | 'follow' | 'mention' | 'reply';

export type Platform = 'x' | 'linkedin' | 'youtube' | 'instagram' | 'tiktok' | 'web';

export type SourceType =
  | 'interaction'
  | 'sw_annotation'
  | 'profile_delta'
  | 'external_event'
  | 'apify_search'
  | 'apify_profile';

export type AgentStatus = 'active' | 'paused' | 'running' | 'idle' | 'error';

export type PrecisionMode = 'discovery' | 'high_precision';

export type SearchRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type LinkedInAccountStatus = 'pending' | 'connected' | 'needs_verification' | 'disconnected' | 'rate_limited' | 'warming_up';

// ============================================================================
// Color Configuration
// ============================================================================

export const SCORE_COLORS = {
  excellent: { bg: 'bg-green-500/10', text: 'text-green-400', icon: '🔥🔥🔥', min: 80 },
  good: { bg: 'bg-lime-500/10', text: 'text-lime-400', icon: '🔥🔥', min: 60 },
  fair: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: '🔥', min: 40 },
  low: { bg: 'bg-orange-500/10', text: 'text-orange-400', icon: '', min: 20 },
  veryLow: { bg: 'bg-red-500/10', text: 'text-red-400', icon: '', min: 0 },
} as const;

export const SIGNAL_COLORS: Record<string, { bg: string; text: string }> = {
  commented_interest: { bg: 'bg-green-500/10', text: 'text-green-400' },
  pain_point_complaint: { bg: 'bg-orange-500/10', text: 'text-orange-400' },
  engaged_competitor: { bg: 'bg-red-500/10', text: 'text-red-400' },
  engaged_influencer: { bg: 'bg-purple-500/10', text: 'text-purple-400' },
  high_activity_spike: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  job_change: { bg: 'bg-cyan-500/10', text: 'text-cyan-400' },
  top_5_percent: { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  recently_raised_funds: { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
};

export const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string }> = {
  new: { bg: 'bg-blue-500/10', text: 'text-blue-400' },
  reviewing: { bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
  shortlisted: { bg: 'bg-green-500/10', text: 'text-green-400' },
  archived: { bg: 'bg-gray-500/10', text: 'text-gray-400' },
};

export const AGENT_STATUS_COLORS: Record<AgentStatus, { bg: string; text: string; dot: string }> = {
  active: { bg: 'bg-green-500/10', text: 'text-green-400', dot: 'bg-green-400' },
  paused: { bg: 'bg-yellow-500/10', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  running: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400' },
  idle: { bg: 'bg-gray-500/10', text: 'text-gray-400', dot: 'bg-gray-400' },
  error: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
};

// ============================================================================
// Core Entities
// ============================================================================

export interface Company {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  headcount_range: string | null;
}

export interface LeadIdentity {
  id: string;
  platform: Platform;
  profile_url: string | null;
  handle: string | null;
  confidence: number;
}

export interface LeadScore {
  icp_profile_id: string;
  icp_profile_name: string;
  icp_fit_score: number;
  intent_score: number;
  overall_score: number;
  score_label: string;
  computed_at: string;
}

export interface IntentSignal {
  id: string;
  signal_type: SignalType;
  signal_label: string;
  source_type: SourceType;
  occurred_at: string;
  strength_score: number;
  confidence_score: number;
  explanation: string;
  sw_content_node_id: string | null;
}

export interface Interaction {
  id: string;
  interaction_type: InteractionType;
  interaction_label: string;
  target_type: string;
  target_id: string;
  occurred_at: string;
  sw_content_node_id: string | null;
}

export interface Lead {
  id: string;
  organization_id: string;
  primary_platform: Platform;
  profile_url: string | null;
  platform_user_id: string | null;
  display_name: string;
  headline: string | null;
  bio: string | null;
  location: string | null;
  company_name: string | null;
  company: Company | null;
  status: LeadStatus;
  status_label: string;
  first_seen_at: string | null;
  last_seen_at: string | null;
  identities: LeadIdentity[];
  scores: LeadScore[];
  intent_signals: IntentSignal[];
  interactions: Interaction[];
  evidence_node_ids: string[];
  discovery_metadata?: {
    search_run_id?: string;
    discovery_scope?: 'strict' | 'broad';
    strict_icp_match?: boolean;
    icp_match_score?: number;
    icp_match_details?: Record<string, 'match' | 'mismatch'>;
  };
  // Computed fields for display
  email?: string | null;
  avatar_url?: string | null;
}

export interface LeadSummary {
  id: string;
  display_name: string;
  headline: string | null;
  company_name: string | null;
  profile_url: string | null;
  primary_platform: Platform;
  status: LeadStatus;
  last_seen_at: string | null;
  avatar_url?: string | null;
}

// ============================================================================
// ICP Profile
// ============================================================================

export interface IcpDefinition {
  // Person criteria
  personTitle?: string[];           // Free-text job titles
  seniority?: string[];             // Seniority levels (CXO, VP, Director, etc.)
  functional?: string[];            // Functional areas (Engineering, Sales, Marketing, etc.)
  personCountry?: string[];         // Person's location country
  personState?: string[];           // Person's location state/region
  
  // Company criteria
  industry?: string[];              // Industry vertical
  industryKeywords?: string[];      // Free-text industry keywords
  companyEmployeeSize?: string[];   // Employee count ranges
  companyCountry?: string[];        // Company HQ country
  companyState?: string[];          // Company HQ state/region
  companyDomain?: string[];         // Specific company domains to target
  businessModel?: string[];         // Product, Services, Solutions
  revenue?: string[];               // Revenue ranges
  
  // Funding criteria
  fundingType?: string[];           // Funding round types
  fundingFromDate?: string;         // Funding date range start (YYYY-MM-DD)
  fundingToDate?: string;           // Funding date range end (YYYY-MM-DD)
  
  // Contact options
  includeEmails?: boolean;          // Whether to include email addresses
  contactEmailStatus?: string;      // Email verification status
  
  // Search options
  totalResults?: number;            // Max results to fetch
  
  // Legacy fields (for backwards compatibility)
  titles?: string[];
  industries?: string[];
  company_sizes?: string[];
  company_types?: string[];
  locations?: string[];
  keywords?: string[];
  excluded_domains?: string[];
  excluded_keywords?: string[];
  geography?: string[];
  job_titles?: string[];
  min_engagement_score?: number;
}

export interface IcpProfile {
  id: string;
  organization_id: string;
  name: string;
  definition: IcpDefinition;
  is_active: boolean;
  created_by_user_id: string | null;
  stats?: {
    total_scores: number;
    total_queues: number;
    leads_matched?: number;
    avg_score?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface IcpProfileFormData {
  name: string;
  definition: IcpDefinition;
  is_active: boolean;
}

// ============================================================================
// Lead Queue
// ============================================================================

export interface LeadQueueEntry {
  id: string;
  rank: number;
  overall_score: number;
  lead: LeadSummary;
  why: {
    primary_reason: string;
    top_signals: Array<{
      type: string;
      label: string;
      occurred_at: string;
    }>;
    icp_match: Record<string, string>;
    evidence_node_ids: string[];
  };
  actioned_at: string | null;
  created_at: string;
}

// ============================================================================
// Search Run
// ============================================================================

export interface SearchRun {
  id: string;
  organization_id: string;
  icp_profile_id: string;
  status: SearchRunStatus;
  apify_actor_id: string;
  apify_run_id: string | null;
  original_icp_criteria: Record<string, any>;
  expanded_search_params: Record<string, any>;
  expansion_rules_applied: Record<string, any>;
  results_collected: number;
  results_filtered_non_lead: number;
  results_filtered_icp_mismatch: number;
  results_retained: number;
  leads_created: number;
  leads_updated: number;
  filter_stats: {
    non_lead_reasons: Record<string, number>;
    icp_mismatch_reasons: Record<string, number>;
    strict_vs_broad: {
      strict_matches: number;
      broad_only_matches: number;
    };
  };
  duration_seconds: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  icp_profile?: IcpProfile;
  // Computed fields
  conversion_rate: number | null;
  strict_match_rate: number | null;
}

// ============================================================================
// Signals Agent
// ============================================================================

export interface SignalsConfig {
  company_signals?: {
    company_linkedin_page?: string;
    your_linkedin_profile?: string;
    track_profile_visitors?: boolean;
    track_company_followers?: boolean;
    connected_account_id?: string;
  };
  engagement_keywords?: Array<{
    keyword: string;
    track: 'posts' | 'likes' | 'comments' | 'all';
  }>;
  influencer_profiles?: string[];
  trigger_events?: {
    top_5_percent?: boolean;
    recently_raised_funds?: boolean;
    recent_job_changes?: boolean;
  };
  competitor_pages?: string[];
  // Extended config for UI
  enabled_signals?: SignalType[];
  min_score_threshold?: number;
  check_frequency_hours?: number;
  auto_queue?: boolean;
  auto_enrich?: boolean;
}

export interface SignalsAgent {
  id: string;
  organization_id: string;
  name: string;
  icp_profile_id: string;
  icp_profile?: IcpProfile;
  status: AgentStatus;
  precision_mode: PrecisionMode;
  signals_config: SignalsConfig;
  leads_list_id?: string;
  last_run_at: string | null;
  leads_found_today: number;
  total_leads_found: number;
  leads_generated?: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Scraping Agent (new Agent model with scheduling)
// ============================================================================

export type ScrapingAgentStatus = 'active' | 'paused' | 'running' | 'error';
export type ScrapingAgentSchedule = 'hourly' | 'every_4_hours' | 'twice_daily' | 'daily' | 'weekly';
export type ScrapingAgentPrecisionMode = 'aggressive' | 'balanced' | 'conservative';
export type AgentRunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type AgentRunTrigger = 'scheduled' | 'manual' | 'api' | 'webhook';

export interface SourcesConfig {
  apify_search?: {
    enabled: boolean;
    max_results?: number;
  };
  competitor_engagers?: {
    enabled: boolean;
    include_likers?: boolean;
    include_commenters?: boolean;
    include_reposters?: boolean;
    max_days_old?: number;
  };
  profile_enrichment?: {
    enabled: boolean;
    auto_enrich_new?: boolean;
  };
}

export interface ScrapingAgent {
  id: string;
  organization_id: string;
  icp_profile_id: string;
  icp_profile?: IcpProfile;
  created_by_user_id: string | null;
  created_by?: { id: string; name: string };
  name: string;
  description: string | null;
  status: ScrapingAgentStatus;
  precision_mode: ScrapingAgentPrecisionMode;
  run_schedule: ScrapingAgentSchedule;
  signals_config: SignalsConfig;
  sources_config: SourcesConfig;
  daily_lead_limit: number;
  leads_found_today: number;
  total_leads_found: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  last_run_at: string | null;
  next_run_at: string | null;
  last_error: string | null;
  runs?: AgentRun[];
  can_run: boolean;
  created_at: string;
  updated_at: string;
}

export interface ScrapingAgentFormData {
  icp_profile_id: string;
  name: string;
  description?: string;
  precision_mode?: ScrapingAgentPrecisionMode;
  run_schedule?: ScrapingAgentSchedule;
  signals_config?: SignalsConfig;
  daily_lead_limit?: number;
  sources_config?: SourcesConfig;
}

export interface ScrapingAgentStats {
  total_agents: number;
  active_agents: number;
  paused_agents: number;
  error_agents: number;
  total_leads_found: number;
  leads_found_today: number;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
}

export interface AgentRun {
  id: string;
  agent_id: string;
  organization_id: string;
  status: AgentRunStatus;
  trigger: AgentRunTrigger;
  sources_config: SourcesConfig;
  sources_results: Record<string, any> | null;
  leads_created: number;
  leads_updated: number;
  leads_skipped: number;
  error_message: string | null;
  error_details: Record<string, any> | null;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Competitors
// ============================================================================

export type CompetitorSource = 'manual' | 'ai_inferred' | 'imported';
export type CompetitorApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface Competitor {
  id: string;
  organization_id: string;
  icp_profile_id: string | null;
  icp_profile?: IcpProfile;
  sw_target_id: string | null;
  name: string;
  linkedin_url: string | null;
  linkedin_company_id: string | null;
  website: string | null;
  source: CompetitorSource;
  source_metadata: Record<string, any> | null;
  confidence_score: number | null;
  approval_status: CompetitorApprovalStatus;
  approved_by_user_id: string | null;
  approved_at: string | null;
  rejected_by_user_id: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  notes: string | null;
  monitoring_enabled: boolean;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompetitorFormData {
  name: string;
  linkedin_url?: string;
  website?: string;
  icp_profile_id?: string;
  notes?: string;
}

export interface CompetitorsListResponse {
  competitors: Competitor[];
  grouped: {
    pending: Competitor[];
    approved: Competitor[];
    rejected: Competitor[];
  };
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// ============================================================================
// LinkedIn Account
// ============================================================================

export interface LinkedInAccount {
  id: string;
  organization_id: string;
  linkedin_member_id: string | null;
  email: string;
  name: string;
  display_name: string;
  profile_url: string | null;
  avatar_url: string | null;
  profile_image_url?: string | null;
  status: LinkedInAccountStatus;
  status_label: string;
  has_totp: boolean;
  totp_enabled?: boolean;
  is_premium?: boolean;
  warmup_started_at: string | null;
  warmup_completed_at: string | null;
  is_warmed_up: boolean;
  warmup_progress?: number;
  connected_at?: string | null;
  last_active_at?: string | null;
  rate_limit: {
    daily_connections_used: number;
    daily_connections_limit: number;
    daily_messages_used: number;
    daily_messages_limit: number;
    daily_profile_views_used: number;
    daily_profile_views_limit: number;
    limit_reset_at: string;
    is_rate_limited: boolean;
  };
  rate_limits?: {
    daily_used: number;
    daily_limit: number;
    weekly_used: number;
    weekly_limit: number;
    reset_at: string;
  };
  last_connected_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface LinkedInAccountCredentials {
  email: string;
  password: string;
  totp_secret?: string;
}

// ============================================================================
// Integrations
// ============================================================================

export interface Integration {
  id: string;
  name: string;
  category: 'crm' | 'outreach' | 'automation';
  description: string;
  icon_url: string;
  is_installed: boolean;
  is_available: boolean;
  config?: Record<string, any>;
}

// ============================================================================
// Insights / Analytics
// ============================================================================

export interface InsightsMetrics {
  total_leads_generated: number;
  avg_leads_per_day: number;
  active_signals: number;
  total_search_runs: number;
  avg_conversion_rate: number;
}

export interface DailyPerformance {
  agent_id: string;
  agent_name: string;
  daily_counts: Array<{
    date: string;
    count: number;
  }>;
}

export interface SignalPerformance {
  signal_type: string;
  signal_label: string;
  leads_generated: number;
  percentage: number;
}

// ============================================================================
// API Request/Response Types
// ============================================================================

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

export interface LeadsListParams {
  organization_id?: string;
  icp_profile_id?: string;
  status?: LeadStatus;
  min_score?: number;
  max_score?: number;
  signal_type?: string;
  date_from?: string;
  date_to?: string;
  q?: string;
  sort?: string;
  direction?: 'asc' | 'desc';
  per_page?: number;
  page?: number;
  discovery_scope?: 'strict' | 'broad';
  list_id?: string;
}

export interface QueueParams {
  organization_id: string;
  icp_profile_id: string;
  date?: string;
}

export interface LeadsListResponse {
  data: Lead[];
  meta: PaginationMeta;
}

export interface LeadResponse {
  data: Lead;
}

export interface IcpProfilesListResponse {
  data: IcpProfile[];
  meta: { total: number };
}

export interface IcpProfileResponse {
  data: IcpProfile;
}

export interface QueueResponse {
  data: LeadQueueEntry[];
  meta: {
    total: number;
    icp_profile_id: string;
    queue_date: string;
  };
}

export interface SearchRunsListResponse {
  data: SearchRun[];
  meta: PaginationMeta;
}

export interface SearchRunResponse {
  data: SearchRun;
}

export interface NarrowingStatsResponse {
  data: {
    total_collected: number;
    total_retained: number;
    overall_conversion_rate: number;
    strict_match_rate: number;
    by_filter: Record<string, number>;
    period: string;
  };
}

export interface InsightsResponse {
  data: {
    metrics: InsightsMetrics;
    daily_performance: DailyPerformance[];
    signals_performance: SignalPerformance[];
  };
}

export interface LinkedInAccountsListResponse {
  data: LinkedInAccount[];
  meta: { total: number };
}

export interface LinkedInAccountResponse {
  data: LinkedInAccount;
}

// ============================================================================
// Utility Functions
// ============================================================================

export function getScoreLabel(score: number): keyof typeof SCORE_COLORS {
  if (score >= 80) return 'excellent';
  if (score >= 60) return 'good';
  if (score >= 40) return 'fair';
  if (score >= 20) return 'low';
  return 'veryLow';
}

export function getScoreColors(score: number) {
  return SCORE_COLORS[getScoreLabel(score)];
}

export function getSignalColors(signalType: string) {
  return SIGNAL_COLORS[signalType] || { bg: 'bg-gray-500/10', text: 'text-gray-400' };
}

export function getStatusColors(status: LeadStatus) {
  return STATUS_COLORS[status];
}

export function getAgentStatusColors(status: AgentStatus) {
  return AGENT_STATUS_COLORS[status];
}

export function formatSignalType(signalType: string): string {
  return signalType
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) return 'a few seconds ago';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
