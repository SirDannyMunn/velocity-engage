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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { cn } from '@/components/ui/utils';
import { pageHeaderVariants, headerIconVariants, emptyStateVariants } from '@engage/styles/variants';

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

const CAMPAIGN_STATUS_CONFIG: Record<CampaignStatus, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' | 'warning' | 'destructive' }> = {
  draft: { label: 'Draft', variant: 'secondary' },
  active: { label: 'Running', variant: 'success' },
  paused: { label: 'Paused', variant: 'warning' },
  completed: { label: 'Completed', variant: 'default' },
  archived: { label: 'Archived', variant: 'secondary' },
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
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-border">
        <div className="px-6 py-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className={pageHeaderVariants()}>
                <div className={headerIconVariants()}>
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                Outreach Campaigns
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Automate LinkedIn outreach with AI-powered messaging
              </p>
            </div>
            <Button onClick={handleCreateCampaign} disabled={creating}>
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Plus className="w-5 h-5 mr-2" />
              )}
              {creating ? 'Creating...' : 'New Campaign'}
            </Button>
          </div>

          {/* Search & Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              {(['all', 'active', 'paused', 'draft', 'completed'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(status)}
                >
                  {status === 'all' ? 'All' : CAMPAIGN_STATUS_CONFIG[status].label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className={emptyStateVariants()}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="w-5 h-5 mr-2 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Workflow className="w-12 h-12 mb-4 text-muted-foreground" />
            <p className="text-lg font-medium">No campaigns yet</p>
            <p className="text-sm mt-1 text-muted-foreground">Create your first campaign to start outreach</p>
            <Button
              variant="outline"
              onClick={handleCreateCampaign}
              disabled={creating}
              className="mt-4"
            >
              {creating ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {creating ? 'Creating...' : 'Create Campaign'}
            </Button>
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
      <div className="flex-1 flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowCampaignList(true)}
                >
                  <ChevronRight className="w-5 h-5 rotate-180" />
                </Button>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-foreground">{selectedCampaign.name}</h1>
                    <Badge variant={statusConfig.variant} className="gap-1.5">
                      {selectedCampaign.status === 'active' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                      )}
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {selectedCampaign.stats.total_contacts} contacts • {selectedCampaign.stats.replied} replies
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Sender Account */}
                {selectedCampaign.sender_account ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg border border-border">
                    <span className="text-xs text-muted-foreground">Sender:</span>
                    <span className="text-sm text-foreground">{selectedCampaign.sender_account.name}</span>
                    {selectedCampaign.sender_account.status !== 'connected' && (
                      <Badge variant="destructive" className="text-xs">
                        Not connected
                      </Badge>
                    )}
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={handleOpenAccountSelector}>
                    Connect Account
                  </Button>
                )}

                {/* Action Button */}
                {selectedCampaign.status === 'active' ? (
                  <Button variant="outline" onClick={handlePauseCampaign}>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </Button>
                ) : (
                  <Button onClick={handleStartCampaign}>
                    <Play className="w-4 h-4 mr-2" />
                    Start Campaign
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <Button
                    key={tab.id}
                    variant={isActive ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge !== undefined && tab.badge > 0 && (
                      <Badge variant={isActive ? 'secondary' : 'outline'} className="text-xs">
                        {tab.badge}
                      </Badge>
                    )}
                  </Button>
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
        <Dialog open={showAccountSelector} onOpenChange={setShowAccountSelector}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Select LinkedIn Account</DialogTitle>
              <DialogDescription>
                Choose which account will send messages for this campaign
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-80 overflow-auto py-4">
              {loadingAccounts ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : linkedInAccounts.length === 0 ? (
                <div className={emptyStateVariants({ className: 'py-8' })}>
                  <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No LinkedIn accounts connected</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    Connect an account in Lead Watcher settings
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {linkedInAccounts.map((account) => (
                    <button
                      key={account.id}
                      onClick={() => handleSelectSenderAccount(account.id)}
                      className="w-full flex items-center gap-3 p-3 bg-muted/50 rounded-xl hover:ring-2 hover:ring-primary/50 transition-all text-left"
                    >
                      <Avatar>
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {account.name?.charAt(0) || account.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {account.name || account.display_name || account.email}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">{account.email}</p>
                      </div>
                      <Badge variant={account.status === 'connected' ? 'success' : 'secondary'}>
                        {account.status_label || account.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
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
    <Card
      onClick={onClick}
      className="group cursor-pointer border-0 hover:ring-2 hover:ring-primary/20 transition-all"
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {campaign.name}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">
              {campaign.description || 'No description'}
            </p>
          </div>
          <Badge variant={statusConfig.variant} className="gap-1.5">
            {campaign.status === 'active' && (
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            )}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold text-foreground">{campaign.stats.total_contacts}</p>
            <p className="text-xs text-muted-foreground">Contacts</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold text-primary">{campaign.stats.replied}</p>
            <p className="text-xs text-muted-foreground">Replies</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-lg">
            <p className="text-lg font-bold text-accent-foreground">{replyRate}%</p>
            <p className="text-xs text-muted-foreground">Reply Rate</p>
          </div>
        </div>

        {/* Steps Preview */}
        <div className="flex items-center gap-1 overflow-hidden">
          {(campaign.steps || []).slice(0, 4).map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex items-center justify-center w-7 h-7 bg-primary/20 rounded-lg flex-shrink-0">
                <span className="text-xs text-primary">{index + 1}</span>
              </div>
              {index < Math.min((campaign.steps || []).length - 1, 3) && (
                <div className="w-3 h-0.5 bg-primary/30 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
          {(campaign.steps || []).length > 4 && (
            <span className="text-xs text-muted-foreground ml-1">+{(campaign.steps || []).length - 4}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CampaignsPage;
