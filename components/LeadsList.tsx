/**
 * LeadsList Component
 * Main leads management interface with filtering, sorting, and actions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Users,
  Download,
  ExternalLink,
  Loader2,
  AlertCircle,
  Check,
  HelpCircle,
  X,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  Lead,
  LeadStatus,
  IcpProfile,
  LeadsListParams,
  PaginationMeta,
  formatRelativeTime,
} from '../types/lead-watcher-types';

// shadcn components
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Package components
import { LeadScoreBadge } from './LeadScoreBadge';
import { SignalBadge } from './SignalBadge';

// CVA variants
import {
  pageHeaderVariants,
  headerIconVariants,
  iconButtonVariants,
  emptyStateVariants,
} from '../styles/variants';

// Lazy load the heavy sidebar component
import type { FC } from 'react';
type LeadDetailSidebarProps = {
  leadId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (status: LeadStatus) => void;
};

// Placeholder for the detail sidebar - will be loaded dynamically
const LeadDetailSidebarPlaceholder: FC<LeadDetailSidebarProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="w-[500px] bg-[#1a1a1a] border-l border-white/10 p-6">
        <div className="flex justify-between items-center mb-4">
          <span className="text-white">Loading...</span>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981] mx-auto" />
      </div>
    </div>
  );
};

interface LeadsListProps {
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}

export function LeadsList({ onNavigate }: LeadsListProps) {
  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [icpProfiles, setIcpProfiles] = useState<IcpProfile[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<LeadsListParams>({
    per_page: 25,
    page: 1,
    sort: 'last_seen_at',
    direction: 'desc',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Selection state
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false);

  // Load data
  const loadLeads = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leadWatcherApi.listLeads({
        ...filters,
        q: searchQuery || undefined,
      });
      setLeads(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const loadIcpProfiles = useCallback(async () => {
    try {
      const response = await leadWatcherApi.listIcpProfiles();
      setIcpProfiles(response.data);
    } catch (err) {
      console.error('Failed to load ICP profiles:', err);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    loadIcpProfiles();
  }, [loadIcpProfiles]);

  // Handlers
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, page: 1 }));
    loadLeads();
  };

  const handleSort = (column: string) => {
    setFilters(prev => ({
      ...prev,
      sort: column,
      direction: prev.sort === column && prev.direction === 'asc' ? 'desc' : 'asc',
      page: 1,
    }));
  };

  const handleFilterChange = (key: keyof LeadsListParams, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelectLead = (leadId: string) => {
    setSelectedLeads(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedLeads.size === leads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(leads.map(l => l.id)));
    }
  };

  const handleRowClick = (lead: Lead) => {
    setSelectedLeadId(lead.id);
    setDetailSidebarOpen(true);
  };

  const handleStatusChange = async (leadId: string, status: LeadStatus) => {
    try {
      await leadWatcherApi.updateLeadStatus(leadId, status);
      setLeads(prev =>
        prev.map(l =>
          l.id === leadId ? { ...l, status, status_label: status.charAt(0).toUpperCase() + status.slice(1) } : l
        )
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleBulkStatusUpdate = async (status: LeadStatus) => {
    if (selectedLeads.size === 0) return;
    try {
      await leadWatcherApi.bulkUpdateLeadStatus(Array.from(selectedLeads), status);
      setLeads(prev =>
        prev.map(l =>
          selectedLeads.has(l.id)
            ? { ...l, status, status_label: status.charAt(0).toUpperCase() + status.slice(1) }
            : l
        )
      );
      setSelectedLeads(new Set());
    } catch (err) {
      console.error('Failed to bulk update status:', err);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await leadWatcherApi.exportLeads(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export leads:', err);
    }
  };

  // Get primary signal for display
  const getPrimarySignal = (lead: Lead) => {
    if (!lead.intent_signals || lead.intent_signals.length === 0) return null;
    return lead.intent_signals.reduce((prev, current) =>
      current.strength_score > prev.strength_score ? current : prev
    );
  };

  // Get primary score for display
  const getPrimaryScore = (lead: Lead) => {
    if (!lead.scores || lead.scores.length === 0) return null;
    return lead.scores[0];
  };

  const SortIndicator = ({ column }: { column: string }) => {
    if (filters.sort !== column) return null;
    return filters.direction === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className={pageHeaderVariants()}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={headerIconVariants({ color: 'primary' })}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Leads</h1>
                <p className="text-sm text-muted-foreground">
                  {meta?.total ?? 0} leads found
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {selectedLeads.size > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedLeads.size} selected
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('shortlisted')}
                    className="bg-primary/10 text-primary hover:bg-primary/20"
                  >
                    Shortlist
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleBulkStatusUpdate('archived')}
                  >
                    Archive
                  </Button>
                </div>
              )}

              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>

              <Button variant="outline" size="icon" onClick={() => loadLeads()}>
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  placeholder="Search by name, email, or company..."
                  className="pl-10"
                />
              </div>
            </form>

            <Button
              variant={showFilters ? 'default' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
              className={cn(showFilters && 'bg-primary/10 text-primary border-primary/30')}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 25 && v !== 1).length > 2 && (
                <Badge variant="default" className="ml-1">
                  {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 25 && v !== 1).length - 2}
                </Badge>
              )}
            </Button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-xl border grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">ICP Profile</Label>
                <Select
                  value={filters.icp_profile_id || 'all'}
                  onValueChange={(value: string) => handleFilterChange('icp_profile_id', value === 'all' ? '' : value)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="All Profiles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Profiles</SelectItem>
                    {icpProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Status</Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value: string) => handleFilterChange('status', value === 'all' ? '' : value as LeadStatus)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="reviewing">Reviewing</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Min Score</Label>
                <Select
                  value={filters.min_score?.toString() || 'any'}
                  onValueChange={(value: string) => handleFilterChange('min_score', value === 'any' ? undefined : Number(value))}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="Any Score" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Score</SelectItem>
                    <SelectItem value="80">80+ (Excellent)</SelectItem>
                    <SelectItem value="60">60+ (Good)</SelectItem>
                    <SelectItem value="40">40+ (Fair)</SelectItem>
                    <SelectItem value="20">20+ (Low)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Discovery Scope</Label>
                <Select
                  value={filters.discovery_scope || 'all'}
                  onValueChange={(value: string) => handleFilterChange('discovery_scope', value === 'all' ? '' : value)}
                >
                  <SelectTrigger size="sm">
                    <SelectValue placeholder="All Matches" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Matches</SelectItem>
                    <SelectItem value="strict">Strict ICP Match</SelectItem>
                    <SelectItem value="broad">Broad Match Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {loading && leads.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadLeads()}>
              Retry
            </Button>
          </div>
        ) : leads.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Users className="text-muted-foreground" />
            <p className="text-muted-foreground">No leads found</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters or run a new search
            </p>
          </div>
        ) : (
          <Table size="sm">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedLeads.size === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('display_name')}
                >
                  <div className="flex items-center gap-1">
                    Contact
                    <SortIndicator column="display_name" />
                  </div>
                </TableHead>
                <TableHead>Signal</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('overall_score')}
                >
                  <div className="flex items-center gap-1">
                    AI Score
                    <SortIndicator column="overall_score" />
                  </div>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('last_seen_at')}
                >
                  <div className="flex items-center gap-1">
                    Last Seen
                    <SortIndicator column="last_seen_at" />
                  </div>
                </TableHead>
                <TableHead>Fit</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => {
                const primarySignal = getPrimarySignal(lead);
                const primaryScore = getPrimaryScore(lead);

                return (
                  <TableRow
                    key={lead.id}
                    onClick={() => handleRowClick(lead)}
                    className={cn(
                      'cursor-pointer',
                      selectedLeads.has(lead.id) && 'bg-primary/5'
                    )}
                  >
                    <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedLeads.has(lead.id)}
                        onCheckedChange={() => handleSelectLead(lead.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback className="bg-gradient-to-br from-primary to-emerald-600 text-primary-foreground">
                            {lead.display_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground truncate">
                              {lead.display_name}
                            </span>
                            {lead.profile_url && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={lead.profile_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-muted-foreground hover:text-[#0077b5] transition-colors"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>View LinkedIn Profile</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">
                            {lead.headline || lead.company_name || 'No details'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {primarySignal ? (
                        <SignalBadge signal={primarySignal} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {primaryScore ? (
                        <LeadScoreBadge score={primaryScore.overall_score} />
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <span className="text-muted-foreground text-sm">{lead.email}</span>
                      ) : (
                        <Button
                          variant="link"
                          size="sm"
                          className="p-0 h-auto text-primary"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            // Handle enrich email
                          }}
                        >
                          Enrich
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lead.last_seen_at ? formatRelativeTime(lead.last_seen_at) : '-'}
                    </TableCell>
                    <TableCell>
                      {lead.discovery_metadata?.strict_icp_match !== undefined && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                'w-6 h-6 rounded-full flex items-center justify-center',
                                lead.discovery_metadata.strict_icp_match
                                  ? 'bg-primary/10 text-primary'
                                  : 'bg-yellow-500/10 text-yellow-400'
                              )}
                            >
                              {lead.discovery_metadata.strict_icp_match ? (
                                <Check className="w-3.5 h-3.5" />
                              ) : (
                                <HelpCircle className="w-3.5 h-3.5" />
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            {lead.discovery_metadata.strict_icp_match ? 'Strict ICP Match' : 'Broad Match'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleStatusChange(lead.id, 'shortlisted')}
                              className={iconButtonVariants({
                                intent: 'success',
                                active: lead.status === 'shortlisted',
                              })}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Shortlist</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleStatusChange(lead.id, 'reviewing')}
                              className={iconButtonVariants({
                                intent: 'warning',
                                active: lead.status === 'reviewing',
                              })}
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Mark for Review</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => handleStatusChange(lead.id, 'archived')}
                              className={iconButtonVariants({
                                intent: 'default',
                                active: lead.status === 'archived',
                              })}
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>Archive</TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination */}
      {meta && meta.last_page > 1 && (
        <div className="flex-shrink-0 px-6 py-4 border-t bg-card/50 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {meta.from || 0} to {meta.to || 0} of {meta.total} leads
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.current_page - 1)}
              disabled={meta.current_page <= 1}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(meta.current_page + 1)}
              disabled={meta.current_page >= meta.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {/* Detail Sidebar */}
      <LeadDetailSidebarPlaceholder
        leadId={selectedLeadId}
        isOpen={detailSidebarOpen}
        onClose={() => {
          setDetailSidebarOpen(false);
          setSelectedLeadId(null);
        }}
        onStatusChange={(status: LeadStatus) => {
          if (selectedLeadId) {
            handleStatusChange(selectedLeadId, status);
          }
        }}
      />
    </div>
  );
}

export default LeadsList;
