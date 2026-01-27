/**
 * CampaignsPage - Main campaign management page
 * Features tabs for Workflow, Scheduled, Contacts, Last Launches, Insights, Settings
 */

import React, { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Plus,
  Settings,
  BarChart3,
  Users,
  Clock,
  History,
  Workflow,
  ChevronRight,
  Loader2,
  AlertCircle,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Edit2,
  Zap,
} from 'lucide-react';
import type { Campaign, CampaignStatus } from '@engage/types/campaign-types';
import type { LinkedInAccount } from '@engage/types/lead-watcher-types';
import { campaignApi } from '@engage/api/campaign-api';
import { leadWatcherApi } from '@engage/api/lead-watcher-api';
import { CampaignWorkflow } from './CampaignWorkflow';
import { CampaignContacts } from './CampaignContacts';
import { CampaignInsights } from './CampaignInsights';
import { CampaignSettings } from './CampaignSettings';
import { CampaignScheduled } from './CampaignScheduled';
import { CampaignLaunches } from './CampaignLaunches';

type TabId = 'workflow' | 'scheduled' | 'contacts' | 'launches' | 'insights' | 'settings';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

interface CampaignsPageProps {
  campaignId?: string;
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}

const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft: { label: 'Draft', color: 'text-[var(--steel-gray)]', bg: 'bg-[var(--charcoal)]', dot: 'bg-[var(--steel-gray)]' },
  active: { label: 'Running', color: 'text-[var(--neon-lime)]', bg: 'bg-[var(--neon-lime)]/20', dot: 'bg-[var(--neon-lime)]' },
  paused: { label: 'Paused', color: 'text-[var(--cyber-blue)]', bg: 'bg-[var(--cyber-blue)]/20', dot: 'bg-[var(--cyber-blue)]' },
  completed: { label: 'Completed', color: 'text-[var(--cyber-blue)]', bg: 'bg-[var(--cyber-blue)]/20', dot: 'bg-[var(--cyber-blue)]' },
  archived: { label: 'Archived', color: 'text-[var(--steel-gray)]', bg: 'bg-[var(--charcoal)]', dot: 'bg-[var(--steel-gray)]' },
};

export const CampaignsPage: React.FC<CampaignsPageProps> = ({
  campaignId,
  onNavigate,
}) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('workflow');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCampaignList, setShowCampaignList] = useState(!campaignId);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | 'all'>('all');
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  const tabs: Tab[] = [
    { id: 'workflow', label: 'Workflow', icon: Workflow },
    { id: 'scheduled', label: 'Scheduled', icon: Clock, badge: selectedCampaign?.stats?.in_queue },
    { id: 'contacts', label: 'Contacts', icon: Users, badge: selectedCampaign?.stats?.total_contacts },
    { id: 'launches', label: 'Last Launches', icon: History },
    { id: 'insights', label: 'Insights', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  useEffect(() => {
    loadCampaigns();
  }, []);

  useEffect(() => {
    if (campaignId && campaigns.length > 0) {
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign) {
        setSelectedCampaign(campaign);
        setShowCampaignList(false);
      }
    }
  }, [campaignId, campaigns]);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await campaignApi.listCampaigns();
      setCampaigns(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to load campaigns');
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await campaignApi.startCampaign(selectedCampaign.id);
      setSelectedCampaign(response.data);
      loadCampaigns();
    } catch (err) {
      console.error('Failed to start campaign:', err);
    }
  };

  const handlePauseCampaign = async () => {
    if (!selectedCampaign) return;
    try {
      const response = await campaignApi.pauseCampaign(selectedCampaign.id);
      setSelectedCampaign(response.data);
      loadCampaigns();
    } catch (err) {
      console.error('Failed to pause campaign:', err);
    }
  };

  const handleOpenAccountSelector = async () => {
    setShowAccountSelector(true);
    setLoadingAccounts(true);
    try {
      const response = await leadWatcherApi.listLinkedInAccounts();
      setLinkedInAccounts(response.data || []);
    } catch (err) {
      console.error('Failed to load LinkedIn accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSelectSenderAccount = async (accountId: string) => {
    if (!selectedCampaign) return;
    try {
      const response = await campaignApi.updateCampaign(selectedCampaign.id, {
        sender_account_id: accountId,
      });
      setSelectedCampaign(response.data);
      loadCampaigns();
      setShowAccountSelector(false);
    } catch (err) {
      console.error('Failed to update sender account:', err);
    }
  };

  const handleCreateCampaign = async () => {
    try {
      setCreating(true);
      const response = await campaignApi.createCampaign({
        name: `New Campaign ${new Date().toLocaleDateString()}`,
        description: '',
      });
      // Add to list and select it
      setCampaigns(prev => [response.data, ...prev]);
      setSelectedCampaign(response.data);
      setShowCampaignList(false);
      setActiveTab('workflow');
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError('Failed to create campaign');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectCampaign = async (campaign: Campaign) => {
    try {
      const response = await campaignApi.getCampaign(campaign.id);
      setSelectedCampaign(response.data);
      setShowCampaignList(false);
      setActiveTab('workflow');
    } catch (err) {
      console.error('Failed to load campaign:', err);
    }
  };

  const filteredCampaigns = campaigns.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const renderCampaignList = () => (
    <div className="flex-1 flex flex-col h-full bg-[var(--void-black)]">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-[var(--charcoal)]">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <div className="p-2 bg-[var(--charcoal)] rounded-xl">
                  <Zap className="w-6 h-6 text-[var(--neon-lime)]" />
                </div>
                Outreach Campaigns
              </h1>
              <p className="text-sm text-[var(--steel-gray)] mt-1">
                Automate LinkedIn outreach with AI-powered messaging
              </p>
            </div>
            <button
              onClick={handleCreateCampaign}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2.5 bg-[var(--neon-lime)] hover:bg-[var(--neon-lime)]/90 text-[var(--void-black)] font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              {creating ? 'Creating...' : 'New Campaign'}
            </button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--steel-gray)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-xl text-white placeholder-[var(--steel-gray)] focus:outline-none focus:border-[var(--neon-lime)]/50"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'active', 'paused', 'draft', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-[var(--neon-lime)] text-[var(--void-black)]'
                      : 'bg-[var(--charcoal)] text-[var(--steel-gray)] hover:text-white hover:bg-[var(--steel-gray)]/20'
                  }`}
                >
                  {status === 'all' ? 'All' : CAMPAIGN_STATUS_CONFIG[status].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--neon-lime)]" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 text-[var(--hot-pink)]">
            <AlertCircle className="w-5 h-5 mr-2" />
            {error}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--steel-gray)]">
            <Workflow className="w-12 h-12 mb-4 text-[var(--steel-gray)]" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="text-sm mt-1">Create your first campaign to start outreach</p>
            <button
              onClick={handleCreateCampaign}
              disabled={creating}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--charcoal)] text-[var(--neon-lime)] rounded-lg hover:bg-[var(--steel-gray)]/20 transition-colors disabled:opacity-50"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {creating ? 'Creating...' : 'Create Campaign'}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => handleSelectCampaign(campaign)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderCampaignDetail = () => {
    if (!selectedCampaign) return null;

    const statusConfig = CAMPAIGN_STATUS_CONFIG[selectedCampaign.status];

    return (
      <div className="flex-1 flex flex-col h-full bg-[var(--void-black)]">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-[var(--charcoal)]">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowCampaignList(true)}
                  className="p-2 hover:bg-[var(--charcoal)] rounded-lg transition-colors text-[var(--steel-gray)] hover:text-white"
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-white">{selectedCampaign.name}</h1>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${selectedCampaign.status === 'active' ? 'animate-pulse' : ''}`} />
                      {statusConfig.label}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--steel-gray)] mt-0.5">
                    {selectedCampaign.stats.total_contacts} contacts • {selectedCampaign.stats.replied} replies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Sender Account */}
                {selectedCampaign.sender_account ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--charcoal)] rounded-lg border border-[var(--steel-gray)]/20">
                    <span className="text-xs text-[var(--steel-gray)]">Sender:</span>
                    <span className="text-sm text-white">{selectedCampaign.sender_account.name}</span>
                    {selectedCampaign.sender_account.status !== 'connected' && (
                      <span className="px-1.5 py-0.5 text-xs bg-[var(--hot-pink)]/20 text-[var(--hot-pink)] rounded">
                        Not connected
                      </span>
                    )}
                  </div>
                ) : (
                  <button 
                    onClick={handleOpenAccountSelector}
                    className="px-3 py-1.5 text-sm text-[var(--cyber-blue)] bg-[var(--cyber-blue)]/10 border border-[var(--cyber-blue)]/30 rounded-lg hover:bg-[var(--cyber-blue)]/20"
                  >
                    Connect Account
                  </button>
                )}

                {/* Action Button */}
                {selectedCampaign.status === 'active' ? (
                  <button
                    onClick={handlePauseCampaign}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[var(--charcoal)] text-[var(--steel-gray)] hover:text-white hover:bg-[var(--steel-gray)]/20 rounded-xl transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                ) : (
                  <button
                    onClick={handleStartCampaign}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[var(--neon-lime)] hover:bg-[var(--neon-lime)]/90 text-[var(--void-black)] font-semibold rounded-xl transition-all"
                  >
                    <Play className="w-4 h-4" />
                    Start Campaign
                  </button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-[var(--neon-lime)] text-[var(--void-black)]'
                        : 'bg-[var(--charcoal)] text-[var(--steel-gray)] hover:text-white hover:bg-[var(--steel-gray)]/20'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <span className={`px-1.5 py-0.5 rounded text-xs ${
                        isActive ? 'bg-[var(--void-black)]/20' : 'bg-[var(--steel-gray)]/20'
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'workflow' && (
            <CampaignWorkflow
              campaign={selectedCampaign}
              onUpdate={(campaign: Campaign) => {
                setSelectedCampaign(campaign);
                loadCampaigns();
              }}
            />
          )}
          {activeTab === 'scheduled' && (
            <CampaignScheduled campaignId={selectedCampaign.id} />
          )}
          {activeTab === 'contacts' && (
            <CampaignContacts campaignId={selectedCampaign.id} />
          )}
          {activeTab === 'launches' && (
            <CampaignLaunches campaignId={selectedCampaign.id} />
          )}
          {activeTab === 'insights' && (
            <CampaignInsights campaignId={selectedCampaign.id} />
          )}
          {activeTab === 'settings' && (
            <CampaignSettings
              campaign={selectedCampaign}
              onUpdate={(campaign: Campaign) => {
                setSelectedCampaign(campaign);
                loadCampaigns();
              }}
            />
          )}
        </div>

        {/* LinkedIn Account Selector Modal */}
        {showAccountSelector && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAccountSelector(false)}
          >
            <div 
              className="bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-2xl w-full max-w-md shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-[var(--steel-gray)]/20">
                <h2 className="text-lg font-semibold text-white">Select LinkedIn Account</h2>
                <p className="text-sm text-[var(--steel-gray)] mt-1">
                  Choose which account will send messages for this campaign
                </p>
              </div>
              
              <div className="p-4 max-h-80 overflow-auto">
                {loadingAccounts ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-[var(--neon-lime)]" />
                  </div>
                ) : linkedInAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-10 h-10 text-[var(--steel-gray)] mx-auto mb-3" />
                    <p className="text-[var(--steel-gray)]">No LinkedIn accounts connected</p>
                    <p className="text-sm text-[var(--steel-gray)]/70 mt-1">
                      Connect an account in Lead Watcher settings
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {linkedInAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handleSelectSenderAccount(account.id)}
                        className="w-full flex items-center gap-3 p-3 bg-[var(--void-black)] rounded-xl hover:ring-2 hover:ring-[var(--neon-lime)]/50 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-[var(--neon-lime)]/20 flex items-center justify-center text-[var(--neon-lime)] font-medium">
                          {account.name?.charAt(0) || account.email?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {account.name || account.display_name || account.email}
                          </p>
                          <p className="text-sm text-[var(--steel-gray)] truncate">{account.email}</p>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          account.status === 'connected' 
                            ? 'bg-[var(--neon-lime)]/20 text-[var(--neon-lime)]' 
                            : 'bg-[var(--steel-gray)]/20 text-[var(--steel-gray)]'
                        }`}>
                          {account.status_label || account.status}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--steel-gray)]/20">
                <button
                  onClick={() => setShowAccountSelector(false)}
                  className="w-full px-4 py-2.5 bg-[var(--void-black)] text-[var(--steel-gray)] hover:text-white rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return showCampaignList ? renderCampaignList() : renderCampaignDetail();
};

// Campaign Card Component
const CampaignCard: React.FC<{ campaign: Campaign; onClick: () => void }> = ({ campaign, onClick }) => {
  const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
  const replyRate = campaign.stats.total_contacts > 0
    ? ((campaign.stats.replied / campaign.stats.total_contacts) * 100).toFixed(1)
    : '0';

  return (
    <div
      onClick={onClick}
      className="group p-5 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-2xl hover:border-[var(--neon-lime)]/50 hover:ring-2 hover:ring-[var(--neon-lime)]/20 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-white truncate group-hover:text-[var(--neon-lime)] transition-colors">
            {campaign.name}
          </h3>
          <p className="text-sm text-[var(--steel-gray)] mt-0.5 truncate">
            {campaign.description || 'No description'}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${campaign.status === 'active' ? 'animate-pulse' : ''}`} />
          {statusConfig.label}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center p-2 bg-[var(--void-black)] rounded-lg">
          <p className="text-lg font-bold text-white">{campaign.stats.total_contacts}</p>
          <p className="text-xs text-[var(--steel-gray)]">Contacts</p>
        </div>
        <div className="text-center p-2 bg-[var(--void-black)] rounded-lg">
          <p className="text-lg font-bold text-[var(--neon-lime)]">{campaign.stats.replied}</p>
          <p className="text-xs text-[var(--steel-gray)]">Replies</p>
        </div>
        <div className="text-center p-2 bg-[var(--void-black)] rounded-lg">
          <p className="text-lg font-bold text-[var(--cyber-blue)]">{replyRate}%</p>
          <p className="text-xs text-[var(--steel-gray)]">Reply Rate</p>
        </div>
      </div>

      {/* Steps Preview */}
      <div className="flex items-center gap-1 overflow-hidden">
        {(campaign.steps || []).slice(0, 4).map((step, index) => (
          <React.Fragment key={step.id}>
            <div className="flex items-center justify-center w-7 h-7 bg-[var(--neon-lime)]/20 rounded-lg flex-shrink-0">
              <span className="text-xs text-[var(--neon-lime)]">{index + 1}</span>
            </div>
            {index < Math.min((campaign.steps || []).length - 1, 3) && (
              <div className="w-3 h-0.5 bg-[var(--neon-lime)]/30 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
        {(campaign.steps || []).length > 4 && (
          <span className="text-xs text-[var(--steel-gray)] ml-1">+{(campaign.steps || []).length - 4}</span>
        )}
      </div>
    </div>
  );
};

export default CampaignsPage;
