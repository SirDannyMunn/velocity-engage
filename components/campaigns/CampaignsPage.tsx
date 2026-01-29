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
  MoreVertical,
  TrendingUp,
  Zap,
  Trash2,
  X,
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/components/ui/utils';
import { emptyStateVariants } from '@engage/styles/variants';

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
  const [showAccountSelector, setShowAccountSelector] = useState(false);
  const [linkedInAccounts, setLinkedInAccounts] = useState<LinkedInAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

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

  const handleToggleCampaignSelection = (campaignId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedCampaigns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(campaignId)) {
        newSet.delete(campaignId);
      } else {
        newSet.add(campaignId);
      }
      return newSet;
    });
  };

  const handleSelectAllCampaigns = () => {
    if (selectedCampaigns.size === campaigns.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(campaigns.map(c => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCampaigns.size === 0) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCampaigns.size} campaign${selectedCampaigns.size > 1 ? 's' : ''}? This action cannot be undone.`
    );
    
    if (!confirmed) return;
    
    try {
      setDeleting(true);
      await campaignApi.bulkDeleteCampaigns(Array.from(selectedCampaigns));
      setCampaigns(prev => prev.filter(c => !selectedCampaigns.has(c.id)));
      setSelectedCampaigns(new Set());
    } catch (err) {
      console.error('Failed to delete campaigns:', err);
      setError('Failed to delete campaigns');
    } finally {
      setDeleting(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedCampaigns(new Set());
  };

  // Calculate summary stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const totalEnrolled = campaigns.reduce((sum, c) => sum + (c.stats?.total_contacts || 0), 0);
  const avgResponseRate = campaigns.length > 0
    ? campaigns.reduce((sum, c) => {
        const rate = c.stats?.total_contacts > 0 
          ? (c.stats.replied / c.stats.total_contacts) * 100 
          : 0;
        return sum + rate;
      }, 0) / campaigns.length
    : 0;

  const renderCampaignList = () => (
    <div className="flex-1 flex flex-col h-full bg-[#fbf9fa] dark:bg-background">
      {/* Bulk Actions Bar */}
      {selectedCampaigns.size > 0 && (
        <div className="flex-shrink-0 px-8 py-3 bg-primary/10 border-b border-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Checkbox
              checked={selectedCampaigns.size === campaigns.length && campaigns.length > 0}
              onCheckedChange={handleSelectAllCampaigns}
            />
            <span className="text-sm font-medium text-foreground">
              {selectedCampaigns.size} campaign{selectedCampaigns.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-8 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Automated outreach workflows for your leads
            </p>
          </div>
          <Button onClick={handleCreateCampaign} disabled={creating}>
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="flex-shrink-0 px-8 pb-6">
        <div className="grid grid-cols-4 gap-4">
          <Card className="bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Total Campaigns</span>
                <Workflow className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{totalCampaigns}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Active Campaigns</span>
                <Play className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{activeCampaigns}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Leads Enrolled</span>
                <Users className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-3xl font-bold text-foreground">{totalEnrolled}</p>
            </CardContent>
          </Card>
          <Card className="bg-card">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">Avg Response Rate</span>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">{avgResponseRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Campaign Grid */}
      <div className="flex-1 overflow-auto px-8 pb-8">
        {loading ? (
          <div className={emptyStateVariants()}>
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="w-5 h-5 mr-2 text-destructive" />
            <span className="text-destructive">{error}</span>
          </div>
        ) : campaigns.length === 0 ? (
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
              Create Campaign
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={() => handleSelectCampaign(campaign)}
                isSelected={selectedCampaigns.has(campaign.id)}
                onToggleSelect={(e) => handleToggleCampaignSelection(campaign.id, e)}
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
interface CampaignCardProps {
  campaign: Campaign;
  onClick: () => void;
  isSelected?: boolean;
  onToggleSelect?: (e?: React.MouseEvent) => void;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ 
  campaign, 
  onClick, 
  isSelected = false,
  onToggleSelect 
}) => {
  const statusConfig = CAMPAIGN_STATUS_CONFIG[campaign.status];
  const replyRate = campaign.stats.total_contacts > 0
    ? ((campaign.stats.replied / campaign.stats.total_contacts) * 100).toFixed(1)
    : '0.0';
  const stepsCompleted = campaign.stats?.steps_completed || 0;
  const stepsCount = campaign.steps?.length || 0;

  // Format last run time
  const formatLastRun = () => {
    if (!campaign.last_run_at) return 'Never';
    const date = new Date(campaign.last_run_at);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  return (
    <Card
      onClick={onClick}
      className={cn(
        "group cursor-pointer bg-card hover:shadow-md transition-all",
        isSelected && "ring-2 ring-primary bg-primary/5"
      )}
    >
      <CardContent className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Selection Checkbox */}
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => onToggleSelect?.()}
                className="mr-1"
              />
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Workflow className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                {campaign.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {stepsCount} step{stepsCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Status Badge */}
        <div className="mb-4">
          <Badge variant={statusConfig.variant} className="gap-1.5">
            {campaign.status === 'active' && (
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Users className="w-3 h-3" />
              Enrolled
            </div>
            <p className="text-lg font-bold text-foreground">{campaign.stats.total_contacts}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <BarChart3 className="w-3 h-3" />
              Replies
            </div>
            <p className="text-lg font-bold text-foreground">{campaign.stats.replied}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <TrendingUp className="w-3 h-3" />
              Rate
            </div>
            <p className="text-lg font-bold text-foreground">{replyRate}%</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Steps Completed</span>
            <span className="font-medium text-foreground">{stepsCompleted}</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: stepsCompleted > 0 ? '100%' : '0%' }}
            />
          </div>
        </div>

        {/* Last Run */}
        <p className="text-xs text-muted-foreground">
          Last run: {formatLastRun()}
        </p>
      </CardContent>
    </Card>
  );
};

export default CampaignsPage;
