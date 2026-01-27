/**
 * LeadDetailSidebar Component
 * Slide-out panel showing full lead details, signals, and actions
 */

import { useState, useEffect } from 'react';
import {
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
  Linkedin,
  Copy,
  CheckCircle,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  Lead,
  LeadStatus,
  LeadScore,
  formatRelativeTime,
} from '../types/lead-watcher-types';
import { LeadScoreBadge } from './LeadScoreBadge';
import { SignalBadge } from './SignalBadge';

// shadcn components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// CVA variants
import { infoRowVariants, avatarVariants, emptyStateVariants } from '../styles/variants';

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

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right\" className="w-full max-w-lg p-0">
        <SheetHeader className="px-6 py-4 border-b">
          <SheetTitle>Lead Details</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 h-[calc(100vh-4rem)]">
          {loading ? (
            <div className={emptyStateVariants()}>\n              <Loader2 className="animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className={emptyStateVariants()}>
              <p className="text-destructive">{error}</p>
            </div>
          ) : lead ? (
            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <Avatar className={avatarVariants({ size: 'xl' })}>
                  <AvatarImage src={lead.avatar_url || undefined} alt={lead.display_name} />
                  <AvatarFallback>
                    {lead.display_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-semibold text-foreground truncate">
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
                    <p className="text-muted-foreground mt-1">{lead.headline}</p>
                  )}
                  {lead.company_name && (
                    <p className="text-muted-foreground text-sm mt-0.5">
                      @ {lead.company_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className={infoRowVariants()}>
                <Mail className="w-5 h-5 text-muted-foreground" />
                {lead.email ? (
                  <>
                    <span className="flex-1 text-foreground">{lead.email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyEmail}
                    >
                      {copied ? (
                        <CheckCircle className="w-4 h-4 text-primary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-muted-foreground">No email found</span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleEnrichEmail}
                    >
                      Find email
                    </Button>
                  </>
                )}
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant={lead.status === 'shortlisted' ? 'default' : 'outline'}
                  className={cn(
                    'flex-1',
                    lead.status === 'shortlisted' && 'bg-primary/20 text-primary border-primary/30'
                  )}
                  onClick={() => onStatusChange('shortlisted')}
                >
                  <Check className="w-4 h-4" />
                  Shortlist
                </Button>
                <Button
                  variant={lead.status === 'reviewing' ? 'default' : 'outline'}
                  className={cn(
                    'flex-1',
                    lead.status === 'reviewing' && 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  )}
                  onClick={() => onStatusChange('reviewing')}
                >
                  <HelpCircle className="w-4 h-4" />
                  Review
                </Button>
                <Button
                  variant={lead.status === 'archived' ? 'default' : 'outline'}
                  className={cn(
                    'flex-1',
                    lead.status === 'archived' && 'bg-muted text-muted-foreground'
                  )}
                  onClick={() => onStatusChange('archived')}
                >
                  <Archive className="w-4 h-4" />
                  Archive
                </Button>
              </div>

                {/* Score */}
                {lead.scores.length > 0 && (
                  <div className="p-4 bg-muted rounded-xl">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-muted-foreground">AI Score</span>
                      <LeadScoreBadge score={lead.scores[0].overall_score} showLabel size="lg" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">ICP Fit</span>
                        <p className="text-foreground font-medium">
                          {Math.round(lead.scores[0].icp_fit_score)}%
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Intent</span>
                        <p className="text-foreground font-medium">
                          {Math.round(lead.scores[0].intent_score)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Signals Section */}
                <Collapsible
                  open={expandedSections.has('signals')}
                  onOpenChange={() => toggleSection('signals')}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between px-4 py-3 h-auto bg-muted/50 hover:bg-muted rounded-none"
                    >
                      <span className="font-medium">
                        Intent Signals ({lead.intent_signals.length})
                      </span>
                      {expandedSections.has('signals') ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 space-y-3">
                    {lead.intent_signals.length === 0 ? (
                      <p className="text-muted-foreground text-sm">No signals detected yet</p>
                    ) : (
                      lead.intent_signals.map((signal) => (
                        <div key={signal.id} className="p-3 bg-muted rounded-lg">
                          <SignalBadge signal={signal} showDescription />
                          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                            <span>
                              Strength: {Math.round(signal.strength_score * 100)}%
                            </span>
                            <span>•</span>
                            <span>{formatRelativeTime(signal.occurred_at)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Basic Information Section */}
                <Collapsible
                  open={expandedSections.has('basic-info')}
                  onOpenChange={() => toggleSection('basic-info')}
                  className="border border-border rounded-xl overflow-hidden"
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full flex items-center justify-between px-4 py-3 h-auto bg-muted/50 hover:bg-muted rounded-none"
                    >
                      <span className="font-medium">Basic Information</span>
                      {expandedSections.has('basic-info') ? (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="p-4 space-y-3">
                    {lead.company && (
                      <div className="flex items-start gap-3">
                        <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Company</p>
                          <p className="text-foreground">{lead.company.name}</p>
                          {lead.company.industry && (
                            <p className="text-sm text-muted-foreground">{lead.company.industry}</p>
                          )}
                        </div>
                      </div>
                    )}
                    {lead.location && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-foreground">{lead.location}</p>
                        </div>
                      </div>
                    )}
                    {lead.company?.domain && (
                      <div className="flex items-start gap-3">
                        <Globe className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Website</p>
                          <a
                            href={`https://${lead.company.domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {lead.company.domain}
                          </a>
                        </div>
                      </div>
                    )}
                    {lead.headline && (
                      <div className="flex items-start gap-3">
                        <Briefcase className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-xs text-muted-foreground">Title</p>
                          <p className="text-foreground">{lead.headline}</p>
                        </div>
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>

                {/* Interactions Section */}
                {lead.interactions.length > 0 && (
                  <Collapsible
                    open={expandedSections.has('interactions')}
                    onOpenChange={() => toggleSection('interactions')}
                    className="border border-border rounded-xl overflow-hidden"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full flex items-center justify-between px-4 py-3 h-auto bg-muted/50 hover:bg-muted rounded-none"
                      >
                        <span className="font-medium">
                          Recent Interactions ({lead.interactions.length})
                        </span>
                        {expandedSections.has('interactions') ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="p-4 space-y-2">
                      {lead.interactions.slice(0, 10).map((interaction) => (
                        <div
                          key={interaction.id}
                          className="flex items-center justify-between py-2 text-sm"
                        >
                          <span className="text-foreground capitalize">
                            {interaction.interaction_label}
                          </span>
                          <span className="text-muted-foreground">
                            {formatRelativeTime(interaction.occurred_at)}
                          </span>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t text-sm text-muted-foreground">
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
          </ScrollArea>
        </SheetContent>
      </Sheet>
  );
}

export default LeadDetailSidebar;
