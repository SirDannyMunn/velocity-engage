/**
 * CompetitorManager - Manage competitors for ICP profile
 * Shows pending AI-inferred suggestions that need approval, plus manual entry
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ExternalLink, 
  Check, 
  X, 
  Plus, 
  Sparkles, 
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Trash2,
  Link as LinkIcon
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import type { Competitor, CompetitorFormData } from '../types/lead-watcher-types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/components/ui/utils';
import { emptyStateVariants } from '../styles/variants';

interface CompetitorManagerProps {
  icpProfileId: string;
  icpProfileName?: string;
  onCompetitorChange?: () => void;
}

export const CompetitorManager: React.FC<CompetitorManagerProps> = ({
  icpProfileId,
  icpProfileName,
  onCompetitorChange,
}) => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [pendingCompetitors, setPendingCompetitors] = useState<Competitor[]>([]);
  const [approvedCompetitors, setApprovedCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [inferring, setInferring] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    pending: true,
    approved: true,
  });
  const [error, setError] = useState<string | null>(null);

  // Form state for adding new competitor
  const [newCompetitor, setNewCompetitor] = useState<CompetitorFormData>({
    name: '',
    linkedin_url: '',
    website: '',
    icp_profile_id: icpProfileId,
    notes: '',
  });

  useEffect(() => {
    loadCompetitors();
  }, [icpProfileId]);

  const loadCompetitors = async () => {
    try {
      setLoading(true);
      const response = await leadWatcherApi.listCompetitors({ icp_profile_id: icpProfileId });
      setCompetitors(response.competitors);
      setPendingCompetitors(response.grouped.pending);
      setApprovedCompetitors(response.grouped.approved);
      setError(null);
    } catch (err) {
      setError('Failed to load competitors');
      console.error('Failed to load competitors:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInferCompetitors = async () => {
    try {
      setInferring(true);
      await leadWatcherApi.inferCompetitors(icpProfileId, 10);
      // Show message that inference started
      setError(null);
      // Poll for updates after a delay
      setTimeout(loadCompetitors, 5000);
    } catch (err) {
      setError('Failed to start competitor inference');
      console.error('Failed to infer competitors:', err);
    } finally {
      setInferring(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await leadWatcherApi.approveCompetitor(id);
      loadCompetitors();
      onCompetitorChange?.();
    } catch (err) {
      console.error('Failed to approve competitor:', err);
    }
  };

  const handleReject = async (id: string) => {
    try {
      await leadWatcherApi.rejectCompetitor(id);
      loadCompetitors();
      onCompetitorChange?.();
    } catch (err) {
      console.error('Failed to reject competitor:', err);
    }
  };

  const handleBulkApprove = async () => {
    try {
      const ids = pendingCompetitors.map(c => c.id);
      await leadWatcherApi.bulkApproveCompetitors(ids);
      loadCompetitors();
      onCompetitorChange?.();
    } catch (err) {
      console.error('Failed to bulk approve:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await leadWatcherApi.deleteCompetitor(id);
      loadCompetitors();
      onCompetitorChange?.();
    } catch (err) {
      console.error('Failed to delete competitor:', err);
    }
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitor.name.trim()) return;

    try {
      await leadWatcherApi.createCompetitor({
        ...newCompetitor,
        icp_profile_id: icpProfileId,
      });
      setNewCompetitor({
        name: '',
        linkedin_url: '',
        website: '',
        icp_profile_id: icpProfileId,
        notes: '',
      });
      setShowAddForm(false);
      loadCompetitors();
      onCompetitorChange?.();
    } catch (err) {
      console.error('Failed to add competitor:', err);
      setError('Failed to add competitor');
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const renderConfidenceBar = (score: number | null) => {
    const percent = (score ?? 0) * 100;
    return (
      <div className="flex items-center gap-2">
        <Progress value={percent} className="w-20 h-1.5" />
        <span className="text-xs text-muted-foreground">{percent.toFixed(0)}%</span>
      </div>
    );
  };

  const renderCompetitorCard = (competitor: Competitor, showActions: boolean = false) => (
    <Card key={competitor.id} className="hover:border-border/80 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">{competitor.name}</span>
              {competitor.source === 'ai_inferred' && (
                <Badge variant="secondary" className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                  AI Suggested
                </Badge>
              )}
            </div>
            
            {/* Links */}
            <div className="flex items-center gap-3 text-sm text-muted-foreground mt-2">
              {competitor.linkedin_url && (
                <a 
                  href={competitor.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                >
                  <LinkIcon className="w-3 h-3" />
                  LinkedIn
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {competitor.website && (
                <a 
                  href={competitor.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  Website
                </a>
              )}
            </div>

            {/* AI Reason */}
            {competitor.source === 'ai_inferred' && competitor.source_metadata?.inference_reason && (
              <p className="text-xs text-muted-foreground/70 mt-2 italic">
                "{competitor.source_metadata.inference_reason}"
              </p>
            )}

            {/* Confidence score for AI suggestions */}
            {competitor.source === 'ai_inferred' && competitor.confidence_score && (
              <div className="mt-2">
                {renderConfidenceBar(competitor.confidence_score)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showActions && competitor.approval_status === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleApprove(competitor.id)}
                  className="h-8 w-8 bg-primary/20 text-primary hover:bg-primary/30"
                  title="Approve"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleReject(competitor.id)}
                  className="h-8 w-8 bg-destructive/20 text-destructive hover:bg-destructive/30"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            )}
            {competitor.approval_status === 'approved' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(competitor.id)}
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={emptyStateVariants({ className: 'p-8' })}>
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Competitors</h3>
          <p className="text-sm text-muted-foreground">
            Monitor competitor LinkedIn pages to find engaged leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleInferCompetitors}
            disabled={inferring}
            className="gap-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 border-purple-500/30"
          >
            {inferring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Suggest with AI
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border-blue-500/30"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <h4 className="text-sm font-medium">Add Competitor</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="comp-name">Company Name *</Label>
                <Input
                  id="comp-name"
                  type="text"
                  value={newCompetitor.name}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Acme Corp"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-linkedin">LinkedIn Company URL</Label>
                <Input
                  id="comp-linkedin"
                  type="url"
                  value={newCompetitor.linkedin_url || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/company/acme"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-website">Website</Label>
                <Input
                  id="comp-website"
                  type="url"
                  value={newCompetitor.website || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="https://acme.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comp-notes">Notes</Label>
                <Input
                  id="comp-notes"
                  type="text"
                  value={newCompetitor.notes || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddCompetitor}
                disabled={!newCompetitor.name.trim()}
              >
                Add Competitor
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Approvals Section */}
      {pendingCompetitors.length > 0 && (
        <Collapsible open={expandedSections.pending} onOpenChange={() => toggleSection('pending')}>
          <Card className="border-yellow-500/30">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between p-4 bg-yellow-500/10 hover:bg-yellow-500/15 transition-colors rounded-t-lg">
                <div className="flex items-center gap-2">
                  {expandedSections.pending ? (
                    <ChevronDown className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-yellow-500" />
                  )}
                  <span className="text-yellow-500 font-medium">
                    Pending Approval ({pendingCompetitors.length})
                  </span>
                </div>
                {pendingCompetitors.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); handleBulkApprove(); }}
                    className="bg-primary/20 text-primary hover:bg-primary/30"
                  >
                    Approve All
                  </Button>
                )}
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <CardContent className="p-4 pt-0 space-y-3">
                {pendingCompetitors.map(c => renderCompetitorCard(c, true))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Approved Competitors Section */}
      <Collapsible open={expandedSections.approved} onOpenChange={() => toggleSection('approved')}>
        <Card>
          <CollapsibleTrigger asChild>
            <button className="w-full flex items-center justify-between p-4 bg-muted/50 hover:bg-muted/80 transition-colors rounded-t-lg">
              <div className="flex items-center gap-2">
                {expandedSections.approved ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <span className="font-medium">
                  Active Competitors ({approvedCompetitors.length})
                </span>
              </div>
            </button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="p-4 pt-0 space-y-3">
              {approvedCompetitors.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No competitors added yet. Use AI suggestions or add manually.
                </p>
              ) : (
                approvedCompetitors.map(c => renderCompetitorCard(c))
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
};

export default CompetitorManager;
