/**
 * CampaignContacts - View and manage campaign contacts
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  Clock,
  ChevronDown,
  ExternalLink,
  MoreVertical,
  Trash2,
  RefreshCw,
  Loader2,
  UserMinus,
  Plus,
  UserPlus,
} from 'lucide-react';
import type { CampaignContact, ContactCampaignStatus } from '@engage/types/campaign-types';
import type { Lead } from '@engage/types/lead-watcher-types';
import { campaignApi } from '@engage/api/campaign-api';
import { leadWatcherApi } from '@engage/api/lead-watcher-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/components/ui/utils';
import { emptyStateVariants } from '@engage/styles/variants';

interface CampaignContactsProps {
  campaignId: string;
}

const STATUS_CONFIG: Record<ContactCampaignStatus, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive'; icon: React.ElementType }> = {
  queued: { label: 'Queued', variant: 'secondary', icon: Clock },
  in_progress: { label: 'In Progress', variant: 'default', icon: RefreshCw },
  replied: { label: 'Replied', variant: 'success', icon: MessageSquare },
  completed: { label: 'Completed', variant: 'success', icon: Check },
  failed: { label: 'Failed', variant: 'destructive', icon: AlertCircle },
  unsubscribed: { label: 'Unsubscribed', variant: 'warning', icon: UserMinus },
};

export const CampaignContacts: React.FC<CampaignContactsProps> = ({ campaignId }) => {
  const [contacts, setContacts] = useState<CampaignContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactCampaignStatus | 'all'>('all');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Add contacts modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableLeads, setAvailableLeads] = useState<Lead[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [addingContacts, setAddingContacts] = useState(false);
  const [leadSearchQuery, setLeadSearchQuery] = useState('');

  useEffect(() => {
    loadContacts();
  }, [campaignId, statusFilter, page]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await campaignApi.getContacts(campaignId, {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        per_page: 25,
      });
      setContacts(response.contacts || []);
      setTotalPages(response.pagination?.total_pages || 1);
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setLoadingLeads(true);
    setSelectedLeadIds([]);
    try {
      const response = await leadWatcherApi.listLeads({ per_page: 100 });
      setAvailableLeads(response.data || []);
    } catch (err) {
      console.error('Failed to load leads:', err);
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleAddContacts = async () => {
    if (selectedLeadIds.length === 0) return;
    setAddingContacts(true);
    try {
      await campaignApi.addContacts(campaignId, selectedLeadIds);
      setShowAddModal(false);
      setSelectedLeadIds([]);
      loadContacts();
    } catch (err) {
      console.error('Failed to add contacts:', err);
    } finally {
      setAddingContacts(false);
    }
  };

  const filteredLeads = availableLeads.filter(lead =>
    lead.display_name?.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
    lead.company_name?.toLowerCase().includes(leadSearchQuery.toLowerCase()) ||
    lead.headline?.toLowerCase().includes(leadSearchQuery.toLowerCase())
  );

  const handleRemoveContacts = async () => {
    if (selectedContacts.length === 0) return;
    if (!confirm(`Remove ${selectedContacts.length} contact(s) from campaign?`)) return;
    
    try {
      await campaignApi.bulkRemoveContacts(campaignId, selectedContacts);
      setSelectedContacts([]);
      loadContacts();
    } catch (err) {
      console.error('Failed to remove contacts:', err);
    }
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(c => c.id));
    }
  };

  const filteredContacts = (contacts || []).filter(c =>
    c.lead?.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.lead?.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="pl-10"
            />
          </div>

          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as ContactCampaignStatus | 'all')}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                  <SelectItem key={status} value={status}>{config.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedContacts.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleRemoveContacts}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove ({selectedContacts.length})
              </Button>
            )}

            <Button onClick={handleOpenAddModal}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contacts
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className={emptyStateVariants()}>
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Users className="w-12 h-12 mb-3 text-muted-foreground" />
            <p className="font-medium">No contacts found</p>
            <p className="text-sm mt-1 text-muted-foreground">Add leads to this campaign to get started</p>
            <Button variant="outline" onClick={handleOpenAddModal} className="mt-4">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Contacts
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Step</TableHead>
                <TableHead>Last Action</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => {
                const statusConfig = STATUS_CONFIG[contact.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedContacts(prev => [...prev, contact.id]);
                          } else {
                            setSelectedContacts(prev => prev.filter(id => id !== contact.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-purple-500/30 to-pink-500/30">
                            {contact.lead.display_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{contact.lead.display_name}</p>
                            {contact.lead.profile_url && (
                              <a
                                href={contact.lead.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {contact.lead.headline || contact.lead.company_name || 'No details'}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusConfig.variant} className="gap-1.5">
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </Badge>
                      {contact.reply_sentiment && (
                        <span className={cn(
                          "ml-2 text-xs",
                          contact.reply_sentiment === 'positive' && 'text-green-500',
                          contact.reply_sentiment === 'negative' && 'text-destructive',
                          contact.reply_sentiment === 'neutral' && 'text-muted-foreground'
                        )}>
                          ({contact.reply_sentiment})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        Step {contact.current_step_order || 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {contact.last_action_at
                          ? new Date(contact.last_action_at).toLocaleDateString()
                          : 'Not started'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Add Contacts Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Contacts to Campaign</DialogTitle>
            <DialogDescription>
              Select leads to add to this campaign
            </DialogDescription>
          </DialogHeader>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              value={leadSearchQuery}
              onChange={(e) => setLeadSearchQuery(e.target.value)}
              placeholder="Search leads..."
              className="pl-10"
            />
          </div>
          
          <div className="max-h-80 overflow-auto">
            {loadingLeads ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className={emptyStateVariants({ className: 'py-8' })}>
                <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No leads found</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Import leads in Lead Watcher first
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLeadIds.includes(lead.id);
                  return (
                    <button
                      key={lead.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedLeadIds(prev => prev.filter(id => id !== lead.id));
                        } else {
                          setSelectedLeadIds(prev => [...prev, lead.id]);
                        }
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                        isSelected 
                          ? "bg-primary/20 ring-2 ring-primary/50" 
                          : "bg-muted hover:ring-2 hover:ring-muted-foreground/30"
                      )}
                    >
                      <Checkbox checked={isSelected} />
                      <Avatar>
                        <AvatarFallback className="bg-primary/20 text-primary">
                          {lead.display_name?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {lead.display_name || 'Unknown'}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {lead.headline || lead.company_name || 'No details'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button variant="ghost" onClick={() => setShowAddModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddContacts}
              disabled={selectedLeadIds.length === 0 || addingContacts}
            >
              {addingContacts ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="w-4 h-4 mr-2" />
              )}
              Add {selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CampaignContacts;
