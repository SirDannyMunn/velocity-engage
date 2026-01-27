/**
 * LeadDetailSidebar Component
 * Slide-out panel showing full lead details, signals, and actions
 */

import { useState, useEffect } from 'react';
import {
  X,
  ExternalLink,
  Mail,
  MapPin,
  Building2,
  Globe,
  Briefcase,
  Check,
  HelpCircle,
  Archive,
  ChevronDown,
  ChevronRight,
  Loader2,
  MessageSquare,
  Linkedin,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  Lead,
  LeadStatus,
  IntentSignal,
  LeadScore,
  formatRelativeTime,
  getStatusColors,
} from '../types/lead-watcher-types';
import { LeadScoreBadge } from './LeadScoreBadge';
import { SignalBadge } from './SignalBadge';

interface LeadDetailSidebarProps {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: LeadStatus) => void;
}

export function LeadDetailSidebar({
  leadId,
  isOpen,
  onClose,
  onStatusChange,
}: LeadDetailSidebarProps) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['signals', 'basic-info'])
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!leadId || !isOpen) {
      setLead(null);
      return;
    }

    const loadLead = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await leadWatcherApi.getLead(leadId);
        setLead(response.data);
      } catch (err: any) {
        setError(err.message || 'Failed to load lead details');
      } finally {
        setLoading(false);
      }
    };

    loadLead();
  }, [leadId, isOpen]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleCopyEmail = async () => {
    if (lead?.email) {
      await navigator.clipboard.writeText(lead.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEnrichEmail = async () => {
    if (!leadId) return;
    try {
      const response = await leadWatcherApi.enrichLeadEmail(leadId);
      if (response.data.email && lead) {
        setLead({ ...lead, email: response.data.email });
      }
    } catch (err) {
      console.error('Failed to enrich email:', err);
    }
  };

  const getPrimaryScore = (scores: LeadScore[]) => {
    return scores.length > 0 ? scores[0] : null;
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 h-full w-full max-w-lg bg-card border-l-[0.5px] border-border/15 z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Lead Details</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 gap-4 px-6">
                <p className="text-red-400">{error}</p>
              </div>
            ) : lead ? (
              <div className="p-6 space-y-6">
                {/* Profile Header */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#10b981] to-emerald-600 flex items-center justify-center text-white text-2xl font-medium flex-shrink-0">
                    {lead.avatar_url ? (
                      <img
                        src={lead.avatar_url}
                        alt={lead.display_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      lead.display_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-semibold text-white truncate">
                        {lead.display_name}
                      </h3>
                      {lead.profile_url && (
                        <a
                          href={lead.profile_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#0077b5] hover:text-[#0077b5]/80 transition-colors"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                    {lead.headline && (
                      <p className="text-gray-400 mt-1">{lead.headline}</p>
                    )}
                    {lead.company_name && (
                      <p className="text-gray-500 text-sm mt-0.5">
                        @ {lead.company_name}
                      </p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
                  <Mail className="w-5 h-5 text-gray-400" />
                  {lead.email ? (
                    <>
                      <span className="flex-1 text-white">{lead.email}</span>
                      <button
                        onClick={handleCopyEmail}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                      >
                        {copied ? (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-gray-500">No email found</span>
                      <button
                        onClick={handleEnrichEmail}
                        className="px-3 py-1 bg-[#10b981]/10 text-[#10b981] rounded-lg text-sm hover:bg-[#10b981]/20 transition-colors"
                      >
                        Find email
                      </button>
                    </>
                  )}
                </div>

                {/* Status Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStatusChange('shortlisted')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                      lead.status === 'shortlisted'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-green-500/10 hover:text-green-400'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    Shortlist
                  </button>
                  <button
                    onClick={() => onStatusChange('reviewing')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                      lead.status === 'reviewing'
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-yellow-500/10 hover:text-yellow-400'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4" />
                    Review
                  </button>
                  <button
                    onClick={() => onStatusChange('archived')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition-colors ${
                      lead.status === 'archived'
                        ? 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                        : 'bg-white/5 text-gray-400 hover:bg-gray-500/10'
                    }`}
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                </div>

                {/* Score */}
                {lead.scores.length > 0 && (
                  <div className="p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-400">AI Score</span>
                      <LeadScoreBadge score={lead.scores[0].overall_score} showLabel size="lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">ICP Fit</span>
                        <p className="text-white font-medium">
                          {Math.round(lead.scores[0].icp_fit_score)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-500">Intent</span>
                        <p className="text-white font-medium">
                          {Math.round(lead.scores[0].intent_score)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signals Section */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('signals')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="font-medium text-white">
                      Intent Signals ({lead.intent_signals.length})
                    </span>
                    {expandedSections.has('signals') ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has('signals') && (
                    <div className="p-4 space-y-3">
                      {lead.intent_signals.length === 0 ? (
                        <p className="text-gray-500 text-sm">No signals detected yet</p>
                      ) : (
                        lead.intent_signals.map((signal) => (
                          <div key={signal.id} className="p-3 bg-white/5 rounded-lg">
                            <SignalBadge signal={signal} showDescription />
                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                              <span>
                                Strength: {Math.round(signal.strength_score * 100)}%
                              </span>
                              <span>•</span>
                              <span>{formatRelativeTime(signal.occurred_at)}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Basic Information Section */}
                <div className="border border-white/10 rounded-xl overflow-hidden">
                  <button
                    onClick={() => toggleSection('basic-info')}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <span className="font-medium text-white">Basic Information</span>
                    {expandedSections.has('basic-info') ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.has('basic-info') && (
                    <div className="p-4 space-y-3">
                      {lead.company && (
                        <div className="flex items-start gap-3">
                          <Building2 className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Company</p>
                            <p className="text-white">{lead.company.name}</p>
                            {lead.company.industry && (
                              <p className="text-sm text-gray-400">{lead.company.industry}</p>
                            )}
                          </div>
                        </div>
                      )}
                      {lead.location && (
                        <div className="flex items-start gap-3">
                          <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Location</p>
                            <p className="text-white">{lead.location}</p>
                          </div>
                        </div>
                      )}
                      {lead.company?.domain && (
                        <div className="flex items-start gap-3">
                          <Globe className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Website</p>
                            <a
                              href={`https://${lead.company.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#10b981] hover:underline"
                            >
                              {lead.company.domain}
                            </a>
                          </div>
                        </div>
                      )}
                      {lead.headline && (
                        <div className="flex items-start gap-3">
                          <Briefcase className="w-4 h-4 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-gray-500">Title</p>
                            <p className="text-white">{lead.headline}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Interactions Section */}
                {lead.interactions.length > 0 && (
                  <div className="border border-white/10 rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggleSection('interactions')}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <span className="font-medium text-white">
                        Recent Interactions ({lead.interactions.length})
                      </span>
                      {expandedSections.has('interactions') ? (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedSections.has('interactions') && (
                      <div className="p-4 space-y-2">
                        {lead.interactions.slice(0, 10).map((interaction) => (
                          <div
                            key={interaction.id}
                            className="flex items-center justify-between py-2 text-sm"
                          >
                            <span className="text-white capitalize">
                              {interaction.interaction_label}
                            </span>
                            <span className="text-gray-500">
                              {formatRelativeTime(interaction.occurred_at)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-white/10 text-sm text-gray-500">
                  <div className="flex justify-between">
                    <span>First seen</span>
                    <span>
                      {lead.first_seen_at
                        ? formatRelativeTime(lead.first_seen_at)
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Last seen</span>
                    <span>
                      {lead.last_seen_at
                        ? formatRelativeTime(lead.last_seen_at)
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

export default LeadDetailSidebar;
