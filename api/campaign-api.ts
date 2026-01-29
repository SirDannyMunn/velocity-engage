/**
 * Campaign API Client
 * API functions for the outreach campaign builder
 */

import { httpClient } from '@/lib/api/http-client';
import type {
  Campaign,
  CampaignFormData,
  CampaignStep,
  StepFormData,
  CampaignContact,
  CampaignInsights,
  CampaignsListResponse,
  CampaignResponse,
  CampaignContactsResponse,
  AIMessageRequest,
  AIMessageResponse,
  MessageTemplate,
} from '../types/campaign-types';

const CAMPAIGNS_PREFIX = '/lead-outreach/campaigns';

export const campaignApi = {
  // ============================================================================
  // Campaigns CRUD
  // ============================================================================

  async listCampaigns(params?: { status?: string }): Promise<CampaignsListResponse> {
    return httpClient.get(CAMPAIGNS_PREFIX, { params });
  },

  async getCampaign(id: string): Promise<CampaignResponse> {
    return httpClient.get(`${CAMPAIGNS_PREFIX}/${id}`);
  },

  async createCampaign(data: CampaignFormData): Promise<CampaignResponse> {
    return httpClient.post(CAMPAIGNS_PREFIX, data);
  },

  async updateCampaign(id: string, data: Partial<CampaignFormData>): Promise<CampaignResponse> {
    return httpClient.put(`${CAMPAIGNS_PREFIX}/${id}`, data);
  },

  async deleteCampaign(id: string): Promise<{ message: string }> {
    return httpClient.delete(`${CAMPAIGNS_PREFIX}/${id}`);
  },

  async bulkDeleteCampaigns(ids: string[]): Promise<{ message: string; deleted: number }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/bulk-delete`, { campaign_ids: ids });
  },

  async duplicateCampaign(id: string, name?: string): Promise<CampaignResponse> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${id}/duplicate`, { name });
  },

  // ============================================================================
  // Campaign Actions
  // ============================================================================

  async startCampaign(id: string): Promise<CampaignResponse> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${id}/start`);
  },

  async pauseCampaign(id: string): Promise<CampaignResponse> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${id}/pause`);
  },

  async resumeCampaign(id: string): Promise<CampaignResponse> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${id}/resume`);
  },

  async completeCampaign(id: string): Promise<CampaignResponse> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${id}/complete`);
  },

  // ============================================================================
  // Campaign Steps
  // ============================================================================

  async addStep(campaignId: string, data: StepFormData): Promise<{ step: CampaignStep }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${campaignId}/steps`, data);
  },

  async updateStep(campaignId: string, stepId: string, data: Partial<StepFormData>): Promise<{ step: CampaignStep }> {
    return httpClient.put(`${CAMPAIGNS_PREFIX}/${campaignId}/steps/${stepId}`, data);
  },

  async deleteStep(campaignId: string, stepId: string): Promise<{ message: string }> {
    return httpClient.delete(`${CAMPAIGNS_PREFIX}/${campaignId}/steps/${stepId}`);
  },

  async reorderSteps(campaignId: string, stepIds: string[]): Promise<{ steps: CampaignStep[] }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${campaignId}/steps/reorder`, { step_ids: stepIds });
  },

  // ============================================================================
  // Campaign Contacts
  // ============================================================================

  async getContacts(
    campaignId: string, 
    params?: { status?: string; page?: number; per_page?: number }
  ): Promise<CampaignContactsResponse> {
    return httpClient.get(`${CAMPAIGNS_PREFIX}/${campaignId}/contacts`, { params });
  },

  async addContacts(campaignId: string, leadIds: string[]): Promise<{ added: number; skipped: number }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${campaignId}/contacts`, { lead_ids: leadIds });
  },

  async removeContact(campaignId: string, contactId: string): Promise<{ message: string }> {
    return httpClient.delete(`${CAMPAIGNS_PREFIX}/${campaignId}/contacts`, { 
      data: { contact_ids: [contactId] } 
    });
  },

  async bulkRemoveContacts(campaignId: string, contactIds: string[]): Promise<{ removed: number }> {
    return httpClient.delete(`${CAMPAIGNS_PREFIX}/${campaignId}/contacts`, { 
      data: { contact_ids: contactIds } 
    });
  },

  // ============================================================================
  // Campaign Insights
  // ============================================================================

  async getInsights(campaignId: string, period?: 'day' | 'week' | 'month' | 'all'): Promise<{ insights: CampaignInsights }> {
    return httpClient.get(`${CAMPAIGNS_PREFIX}/${campaignId}/insights`, { params: { period } });
  },

  async getLastLaunches(campaignId: string, limit?: number): Promise<{ launches: any[] }> {
    return httpClient.get(`${CAMPAIGNS_PREFIX}/${campaignId}/launches`, { params: { limit } });
  },

  // ============================================================================
  // AI Message Generation
  // ============================================================================

  async generateMessage(request: AIMessageRequest): Promise<AIMessageResponse> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/ai/generate-message`, request);
  },

  async generateVariations(messageId: string, count?: number): Promise<{ variations: string[] }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/ai/variations`, { message_id: messageId, count });
  },

  async improveMessage(message: string, instructions: string): Promise<{ improved: string }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/ai/improve`, { message, instructions });
  },

  // ============================================================================
  // Message Templates
  // ============================================================================

  async listTemplates(type?: 'invitation' | 'message' | 'email'): Promise<{ templates: MessageTemplate[] }> {
    return httpClient.get(`${CAMPAIGNS_PREFIX}/templates`, { params: { type } });
  },

  async createTemplate(data: Partial<MessageTemplate>): Promise<{ template: MessageTemplate }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/templates`, data);
  },

  async updateTemplate(id: string, data: Partial<MessageTemplate>): Promise<{ template: MessageTemplate }> {
    return httpClient.put(`${CAMPAIGNS_PREFIX}/templates/${id}`, data);
  },

  async deleteTemplate(id: string): Promise<{ message: string }> {
    return httpClient.delete(`${CAMPAIGNS_PREFIX}/templates/${id}`);
  },

  // ============================================================================
  // Scheduling
  // ============================================================================

  async getScheduledActions(campaignId: string): Promise<{ data: any[]; meta: any }> {
    return httpClient.get(`${CAMPAIGNS_PREFIX}/${campaignId}/scheduled-actions`);
  },

  async cancelScheduledAction(campaignId: string, actionId: string): Promise<{ data: any }> {
    return httpClient.post(`${CAMPAIGNS_PREFIX}/${campaignId}/scheduled-actions/${actionId}/cancel`);
  },
};

export default campaignApi;
