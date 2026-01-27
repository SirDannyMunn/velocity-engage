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

interface CampaignContactsProps {
  campaignId: string;
}

const STATUS_CONFIG: Record<ContactCampaignStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  queued: { label: 'Queued', color: 'text-zinc-400', bg: 'bg-zinc-500/20', icon: Clock },
  in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: RefreshCw },
  replied: { label: 'Replied', color: 'text-emerald-400', bg: 'bg-emerald-500/20', icon: MessageSquare },
  completed: { label: 'Completed', color: 'text-green-400', bg: 'bg-green-500/20', icon: Check },
  failed: { label: 'Failed', color: 'text-red-400', bg: 'bg-red-500/20', icon: AlertCircle },
  unsubscribed: { label: 'Unsubscribed', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: UserMinus },
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
      <div className="flex-shrink-0 p-4 border-b border-[var(--charcoal)]">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--steel-gray)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search contacts..."
              className="w-full pl-10 pr-4 py-2 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-lg text-white placeholder-[var(--steel-gray)] focus:outline-none focus:border-[var(--neon-lime)]/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContactCampaignStatus | 'all')}
              className="px-3 py-2 bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-lg text-white text-sm focus:outline-none focus:border-[var(--neon-lime)]/50"
            >
              <option value="all">All Statuses</option>
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <option key={status} value={status}>{config.label}</option>
              ))}
            </select>

            {selectedContacts.length > 0 && (
              <button
                onClick={handleRemoveContacts}
                className="flex items-center gap-2 px-3 py-2 bg-[var(--hot-pink)]/20 text-[var(--hot-pink)] rounded-lg hover:bg-[var(--hot-pink)]/30 transition-colors text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Remove ({selectedContacts.length})
              </button>
            )}

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--neon-lime)] text-[var(--void-black)] font-medium rounded-lg hover:bg-[var(--neon-lime)]/90 transition-colors text-sm"
            >
              <UserPlus className="w-4 h-4" />
              Add Contacts
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--neon-lime)]" />
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--steel-gray)]">
            <Users className="w-12 h-12 mb-3 text-[var(--steel-gray)]" />
            <p className="font-medium">No contacts found</p>
            <p className="text-sm mt-1">Add leads to this campaign to get started</p>
            <button
              onClick={handleOpenAddModal}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-[var(--charcoal)] text-[var(--neon-lime)] rounded-lg hover:bg-[var(--steel-gray)]/20 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Contacts
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="sticky top-0 bg-zinc-900 border-b border-zinc-800">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedContacts.length === contacts.length && contacts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Current Step
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  Last Action
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredContacts.map((contact) => {
                const statusConfig = STATUS_CONFIG[contact.status];
                const StatusIcon = statusConfig.icon;
                
                return (
                  <tr
                    key={contact.id}
                    className="hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts(prev => [...prev, contact.id]);
                          } else {
                            setSelectedContacts(prev => prev.filter(id => id !== contact.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-purple-500 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 flex items-center justify-center text-white font-medium">
                          {contact.lead.display_name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{contact.lead.display_name}</p>
                            {contact.lead.profile_url && (
                              <a
                                href={contact.lead.profile_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-zinc-400 hover:text-blue-400 transition-colors"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                          <p className="text-sm text-zinc-500">
                            {contact.lead.headline || contact.lead.company_name || 'No details'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusConfig.label}
                      </span>
                      {contact.reply_sentiment && (
                        <span className={`ml-2 text-xs ${
                          contact.reply_sentiment === 'positive' ? 'text-emerald-400' :
                          contact.reply_sentiment === 'negative' ? 'text-red-400' : 'text-zinc-400'
                        }`}>
                          ({contact.reply_sentiment})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-400">
                        Step {contact.current_step_order || 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-zinc-500">
                        {contact.last_action_at
                          ? new Date(contact.last_action_at).toLocaleDateString()
                          : 'Not started'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-t border-[var(--charcoal)]">
          <p className="text-sm text-[var(--steel-gray)]">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm text-[var(--steel-gray)] hover:text-white hover:bg-[var(--charcoal)] rounded-lg transition-colors disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm text-[var(--steel-gray)] hover:text-white hover:bg-[var(--charcoal)] rounded-lg transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add Contacts Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-[var(--charcoal)] border border-[var(--steel-gray)]/20 rounded-2xl w-full max-w-lg shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-[var(--steel-gray)]/20">
              <h2 className="text-lg font-semibold text-white">Add Contacts to Campaign</h2>
              <p className="text-sm text-[var(--steel-gray)] mt-1">
                Select leads to add to this campaign
              </p>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-[var(--steel-gray)]/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--steel-gray)]" />
                <input
                  type="text"
                  value={leadSearchQuery}
                  onChange={(e) => setLeadSearchQuery(e.target.value)}
                  placeholder="Search leads..."
                  className="w-full pl-10 pr-4 py-2 bg-[var(--void-black)] border border-[var(--steel-gray)]/20 rounded-lg text-white placeholder-[var(--steel-gray)] focus:outline-none focus:border-[var(--neon-lime)]/50"
                />
              </div>
            </div>
            
            <div className="max-h-80 overflow-auto p-4">
              {loadingLeads ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[var(--neon-lime)]" />
                </div>
              ) : filteredLeads.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-10 h-10 text-[var(--steel-gray)] mx-auto mb-3" />
                  <p className="text-[var(--steel-gray)]">No leads found</p>
                  <p className="text-sm text-[var(--steel-gray)]/70 mt-1">
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
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
                          isSelected 
                            ? 'bg-[var(--neon-lime)]/20 ring-2 ring-[var(--neon-lime)]/50' 
                            : 'bg-[var(--void-black)] hover:ring-2 hover:ring-[var(--steel-gray)]/30'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          isSelected 
                            ? 'border-[var(--neon-lime)] bg-[var(--neon-lime)]' 
                            : 'border-[var(--steel-gray)]/50'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 text-[var(--void-black)]" />}
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[var(--neon-lime)]/20 flex items-center justify-center text-[var(--neon-lime)] font-medium">
                          {lead.display_name?.charAt(0) || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-white truncate">
                            {lead.display_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-[var(--steel-gray)] truncate">
                            {lead.headline || lead.company_name || 'No details'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-[var(--steel-gray)]/20 flex items-center justify-between">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 text-[var(--steel-gray)] hover:text-white rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddContacts}
                disabled={selectedLeadIds.length === 0 || addingContacts}
                className="flex items-center gap-2 px-5 py-2.5 bg-[var(--neon-lime)] text-[var(--void-black)] font-medium rounded-xl hover:bg-[var(--neon-lime)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addingContacts ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                Add {selectedLeadIds.length > 0 ? `(${selectedLeadIds.length})` : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignContacts;
