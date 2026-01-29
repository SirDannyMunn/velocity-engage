/**
 * Lead Watcher API Client
 * API functions for the Lead Watcher AI-powered lead discovery system
 */

import { httpClient } from '@/lib/api/http-client';
import {
  Lead,
  LeadStatus,
  IcpProfile,
  IcpProfileFormData,
  LeadQueueEntry,
  SearchRun,
  SignalsAgent,
  SignalsConfig,
  LinkedInAccount,
  LinkedInAccountCredentials,
  Integration,
  InsightsMetrics,
  DailyPerformance,
  SignalPerformance,
  PaginationMeta,
  LeadsListParams,
  QueueParams,
  LeadsListResponse,
  LeadResponse,
  IcpProfilesListResponse,
  IcpProfileResponse,
  QueueResponse,
  SearchRunsListResponse,
  SearchRunResponse,
  NarrowingStatsResponse,
  InsightsResponse,
  LinkedInAccountsListResponse,
  LinkedInAccountResponse,
  ScrapingAgent,
  ScrapingAgentFormData,
  ScrapingAgentStats,
  AgentRun,
  Competitor,
  CompetitorFormData,
  CompetitorsListResponse,
} from '../types/lead-watcher-types';

const LEAD_WATCHER_PREFIX = '/lead-watcher';
const LEAD_OUTREACH_PREFIX = '/lead-outreach';

export const leadWatcherApi = {
  // ============================================================================
  // ICP Profiles
  // ============================================================================

  async listIcpProfiles(organizationId?: string): Promise<IcpProfilesListResponse> {
    const params = organizationId ? { organization_id: organizationId } : {};
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/icp-profiles`, { params });
  },

  async getIcpProfile(id: string): Promise<IcpProfileResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/icp-profiles/${id}`);
  },

  async createIcpProfile(data: IcpProfileFormData): Promise<IcpProfileResponse> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/icp-profiles`, data);
  },

  async updateIcpProfile(id: string, data: Partial<IcpProfileFormData>): Promise<IcpProfileResponse> {
    return httpClient.put(`${LEAD_WATCHER_PREFIX}/icp-profiles/${id}`, data);
  },

  async deleteIcpProfile(id: string): Promise<void> {
    return httpClient.delete(`${LEAD_WATCHER_PREFIX}/icp-profiles/${id}`);
  },

  async toggleIcpProfileActive(id: string, isActive: boolean): Promise<IcpProfileResponse> {
    return httpClient.patch(`${LEAD_WATCHER_PREFIX}/icp-profiles/${id}/toggle`, { is_active: isActive });
  },

  async duplicateIcpProfile(id: string, name?: string): Promise<IcpProfileResponse> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/icp-profiles/${id}/duplicate`, { name });
  },

  // ============================================================================
  // Leads
  // ============================================================================

  async listLeads(params?: LeadsListParams): Promise<LeadsListResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/leads`, { params });
  },

  async getLead(id: string): Promise<LeadResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/leads/${id}`);
  },

  async updateLeadStatus(id: string, status: LeadStatus): Promise<{ data: { id: string; status: LeadStatus; status_label: string } }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/leads/${id}/status`, { status });
  },

  async getLeadSignals(id: string): Promise<{ data: Lead['intent_signals'] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/leads/${id}/signals`);
  },

  async getLeadInteractions(id: string): Promise<{ data: Lead['interactions'] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/leads/${id}/interactions`);
  },

  async enrichLeadEmail(id: string): Promise<{ data: { email: string | null; success: boolean } }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/leads/${id}/enrich-email`);
  },

  async bulkUpdateLeadStatus(leadIds: string[], status: LeadStatus): Promise<{ data: { updated: number } }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/leads/bulk-status`, { lead_ids: leadIds, status });
  },

  async exportLeads(params?: LeadsListParams): Promise<Blob> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/leads/export`, { 
      params,
      responseType: 'blob' 
    });
  },

  // ============================================================================
  // Lead Queues
  // ============================================================================

  async getTodayQueue(params: QueueParams): Promise<QueueResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/queues/today`, { params });
  },

  async getQueueHistory(params: Partial<QueueParams> & { days?: number }): Promise<{ data: LeadQueueEntry[] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/queues/history`, { params });
  },

  async markQueueActioned(id: string): Promise<void> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/queues/${id}/mark-actioned`);
  },

  async buildQueue(icpProfileId: string, date?: string): Promise<{ data: { queued: number; icp_profile_id: string } }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/queues/build`, { 
      icp_profile_id: icpProfileId,
      date 
    });
  },

  // ============================================================================
  // Search Runs
  // ============================================================================

  async listSearchRuns(params?: { 
    organization_id?: string; 
    icp_profile_id?: string; 
    status?: string;
    per_page?: number;
    page?: number;
  }): Promise<SearchRunsListResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/search-runs`, { params });
  },

  async getSearchRun(id: string): Promise<SearchRunResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/search-runs/${id}`);
  },

  async createSearchRun(data: { 
    organization_id?: string; 
    icp_profile_id: string; 
    max_results?: number;
  }): Promise<SearchRunResponse> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/search-runs`, data);
  },

  async getNarrowingStats(params?: {
    organization_id?: string;
    icp_profile_id?: string;
    days?: number;
  }): Promise<NarrowingStatsResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/search-runs/narrowing-stats`, { params });
  },

  async previewIcpExpansion(icpProfileId: string): Promise<{ data: { 
    original_criteria: Record<string, any>;
    expanded_params: Record<string, any>;
    expansion_rules: Record<string, any>;
  }}> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/search-runs/preview-expansion`, { 
      icp_profile_id: icpProfileId 
    });
  },

  // ============================================================================
  // Signals Agents
  // ============================================================================

  async listSignalsAgents(params?: { organization_id?: string }): Promise<{ data: SignalsAgent[]; meta: { total: number } }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/agents`, { params });
  },

  async getSignalsAgent(id: string): Promise<{ data: SignalsAgent }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/agents/${id}`);
  },

  async createSignalsAgent(data: {
    name: string;
    icp_profile_id: string;
    precision_mode?: 'discovery' | 'high_precision';
    signals_config?: SignalsConfig;
  }): Promise<{ data: SignalsAgent }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/agents`, data);
  },

  async updateSignalsAgent(id: string, data: Partial<{
    name: string;
    icp_profile_id: string;
    precision_mode: 'discovery' | 'high_precision';
    signals_config: SignalsConfig;
  }>): Promise<{ data: SignalsAgent }> {
    return httpClient.put(`${LEAD_WATCHER_PREFIX}/agents/${id}`, data);
  },

  async deleteSignalsAgent(id: string): Promise<void> {
    return httpClient.delete(`${LEAD_WATCHER_PREFIX}/agents/${id}`);
  },

  async startSignalsAgent(id: string): Promise<{ data: SignalsAgent }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/agents/${id}/start`);
  },

  async pauseSignalsAgent(id: string): Promise<{ data: SignalsAgent }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/agents/${id}/pause`);
  },

  async getSignalsAgentConfig(id: string): Promise<{ data: SignalsConfig }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/agents/${id}/signals-config`);
  },

  async updateSignalsAgentConfig(id: string, config: SignalsConfig): Promise<{ data: SignalsConfig }> {
    return httpClient.put(`${LEAD_WATCHER_PREFIX}/agents/${id}/signals-config`, config);
  },

  // ============================================================================
  // Insights & Analytics
  // ============================================================================

  async getInsightsMetrics(params?: { 
    organization_id?: string;
    icp_profile_id?: string;
    days?: number;
  }): Promise<{ data: InsightsMetrics }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/insights/metrics`, { params });
  },

  async getDailyPerformance(params?: {
    organization_id?: string;
    days?: number;
  }): Promise<{ data: DailyPerformance[] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/insights/daily-performance`, { params });
  },

  async getSignalsPerformance(params?: {
    organization_id?: string;
    icp_profile_id?: string;
    days?: number;
  }): Promise<{ data: SignalPerformance[] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/insights/signals-performance`, { params });
  },

  async getFullInsights(params?: {
    organization_id?: string;
    icp_profile_id?: string;
    days?: number;
  }): Promise<InsightsResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/insights`, { params });
  },

  // ============================================================================
  // LinkedIn Accounts
  // ============================================================================

  async listLinkedInAccounts(params?: { organization_id?: string }): Promise<LinkedInAccountsListResponse> {
    return httpClient.get(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts`, { params });
  },

  async getLinkedInAccount(id: string): Promise<LinkedInAccountResponse> {
    return httpClient.get(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}`);
  },

  async createLinkedInAccount(data: { 
    email: string;
    password?: string;
    display_name?: string;
    totp_secret?: string;
  }): Promise<LinkedInAccountResponse> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts`, data);
  },

  async updateLinkedInAccount(id: string, data: { display_name?: string }): Promise<LinkedInAccountResponse> {
    return httpClient.patch(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}`, data);
  },

  async deleteLinkedInAccount(id: string): Promise<void> {
    return httpClient.delete(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}`);
  },

  async connectLinkedInAccount(id: string, credentials: LinkedInAccountCredentials): Promise<LinkedInAccountResponse> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/connect`, credentials);
  },

  async disconnectLinkedInAccount(id: string): Promise<LinkedInAccountResponse> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/disconnect`);
  },

  async storeTotpSecret(id: string, totpSecret: string): Promise<LinkedInAccountResponse> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/totp`, { totp_secret: totpSecret });
  },

  async getTotpCode(id: string): Promise<{ code: string; valid_for_seconds: number }> {
    return httpClient.get(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/totp-code`);
  },

  async startManualConnect(id: string): Promise<{ session_id: string; live_url: string; expires_at: string }> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/manual-connect/start`);
  },

  async confirmManualConnect(id: string): Promise<{ success: boolean; message: string }> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/manual-connect/confirm`);
  },

  async getLinkedInRateLimits(id: string): Promise<{ data: LinkedInAccount['rate_limit'] }> {
    return httpClient.get(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/rate-limits`);
  },

  async resetLinkedInRateLimits(id: string): Promise<{ data: LinkedInAccount['rate_limit'] }> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/rate-limits/reset`);
  },

  async startLinkedInWarmup(id: string): Promise<LinkedInAccountResponse> {
    return httpClient.post(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/warmup/start`);
  },

  async getLinkedInWarmupProgress(id: string): Promise<{ data: { progress: number; status: string; days_remaining: number } }> {
    return httpClient.get(`${LEAD_OUTREACH_PREFIX}/linkedin-accounts/${id}/warmup/progress`);
  },

  // ============================================================================
  // Integrations
  // ============================================================================

  async listIntegrations(): Promise<{ data: Integration[] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/integrations`);
  },

  async getIntegration(id: string): Promise<{ data: Integration }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/integrations/${id}`);
  },

  async installIntegration(id: string, config?: Record<string, any>): Promise<{ data: Integration }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/integrations/${id}/install`, { config });
  },

  async uninstallIntegration(id: string): Promise<void> {
    return httpClient.delete(`${LEAD_WATCHER_PREFIX}/integrations/${id}/uninstall`);
  },

  async updateIntegrationConfig(id: string, config: Record<string, any>): Promise<{ data: Integration }> {
    return httpClient.put(`${LEAD_WATCHER_PREFIX}/integrations/${id}/config`, config);
  },

  async testIntegration(id: string): Promise<{ data: { success: boolean; message: string } }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/integrations/${id}/test`);
  },

  // ============================================================================
  // Lead Scoring (manual operations)
  // ============================================================================

  async scoreLeads(icpProfileId: string, leadIds?: string[]): Promise<{ data: { scored: number } }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/scoring/score`, {
      icp_profile_id: icpProfileId,
      lead_ids: leadIds,
    });
  },

  async getLeadScores(leadId: string): Promise<{ data: Lead['scores'] }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/leads/${leadId}/scores`);
  },

  // ============================================================================
  // Scraping Agents
  // ============================================================================

  async listScrapingAgents(): Promise<{ agents: ScrapingAgent[]; stats: ScrapingAgentStats }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/scraping-agents`);
  },

  async getScrapingAgent(id: string): Promise<{ agent: ScrapingAgent }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}`);
  },

  async createScrapingAgent(data: ScrapingAgentFormData): Promise<{ agent: ScrapingAgent; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/scraping-agents`, data);
  },

  async updateScrapingAgent(id: string, data: Partial<ScrapingAgentFormData>): Promise<{ agent: ScrapingAgent; message: string }> {
    return httpClient.put(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}`, data);
  },

  async deleteScrapingAgent(id: string): Promise<{ message: string }> {
    return httpClient.delete(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}`);
  },

  async activateScrapingAgent(id: string): Promise<{ agent: ScrapingAgent; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}/activate`);
  },

  async pauseScrapingAgent(id: string): Promise<{ agent: ScrapingAgent; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}/pause`);
  },

  async triggerScrapingAgent(id: string): Promise<{ run: AgentRun; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}/trigger`);
  },

  async getScrapingAgentRuns(id: string, params?: { page?: number; per_page?: number }): Promise<{ data: AgentRun[]; meta: PaginationMeta }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/scraping-agents/${id}/runs`, { params });
  },

  // ============================================================================
  // Competitors
  // ============================================================================

  async listCompetitors(params?: { status?: 'pending' | 'approved' | 'rejected'; icp_profile_id?: string }): Promise<CompetitorsListResponse> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/competitors`, { params });
  },

  async getCompetitor(id: string): Promise<{ competitor: Competitor }> {
    return httpClient.get(`${LEAD_WATCHER_PREFIX}/competitors/${id}`);
  },

  async createCompetitor(data: CompetitorFormData): Promise<{ competitor: Competitor; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors`, data);
  },

  async updateCompetitor(id: string, data: Partial<CompetitorFormData>): Promise<{ competitor: Competitor; message: string }> {
    return httpClient.put(`${LEAD_WATCHER_PREFIX}/competitors/${id}`, data);
  },

  async deleteCompetitor(id: string): Promise<{ message: string }> {
    return httpClient.delete(`${LEAD_WATCHER_PREFIX}/competitors/${id}`);
  },

  async approveCompetitor(id: string): Promise<{ competitor: Competitor; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors/${id}/approve`);
  },

  async rejectCompetitor(id: string, reason?: string): Promise<{ competitor: Competitor; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors/${id}/reject`, { reason });
  },

  async bulkApproveCompetitors(competitorIds: string[]): Promise<{ message: string; count: number }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors/bulk-approve`, { competitor_ids: competitorIds });
  },

  async bulkRejectCompetitors(competitorIds: string[], reason?: string): Promise<{ message: string; count: number }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors/bulk-reject`, { competitor_ids: competitorIds, reason });
  },

  async inferCompetitors(icpProfileId: string, maxResults?: number): Promise<{ message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors/infer`, { icp_profile_id: icpProfileId, max_results: maxResults });
  },

  async linkCompetitorToSwTarget(id: string, swTargetId: string): Promise<{ competitor: Competitor; message: string }> {
    return httpClient.post(`${LEAD_WATCHER_PREFIX}/competitors/${id}/link-sw-target`, { sw_target_id: swTargetId });
  },
};

export default leadWatcherApi;
