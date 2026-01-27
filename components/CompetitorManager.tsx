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
        <div className="w-20 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-zinc-400">{percent.toFixed(0)}%</span>
      </div>
    );
  };

  const renderCompetitorCard = (competitor: Competitor, showActions: boolean = false) => (
    <div 
      key={competitor.id}
      className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg hover:border-zinc-600/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-zinc-400 flex-shrink-0" />
            <span className="font-medium text-white truncate">{competitor.name}</span>
            {competitor.source === 'ai_inferred' && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-500/20 text-purple-400 rounded">
                AI Suggested
              </span>
            )}
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-3 text-sm text-zinc-400 mt-2">
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
            <p className="text-xs text-zinc-500 mt-2 italic">
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
              <button
                onClick={() => handleApprove(competitor.id)}
                className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                title="Approve"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleReject(competitor.id)}
                className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                title="Reject"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
          {competitor.approval_status === 'approved' && (
            <button
              onClick={() => handleDelete(competitor.id)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Competitors</h3>
          <p className="text-sm text-zinc-400">
            Monitor competitor LinkedIn pages to find engaged leads
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleInferCompetitors}
            disabled={inferring}
            className="flex items-center gap-2 px-3 py-2 bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 rounded-lg transition-colors disabled:opacity-50"
          >
            {inferring ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Suggest with AI
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Manually
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="p-4 bg-zinc-800/50 border border-zinc-700/50 rounded-lg space-y-4">
          <h4 className="text-sm font-medium text-zinc-300">Add Competitor</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Company Name *</label>
              <input
                type="text"
                value={newCompetitor.name}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Acme Corp"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">LinkedIn Company URL</label>
              <input
                type="url"
                value={newCompetitor.linkedin_url || ''}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, linkedin_url: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="https://linkedin.com/company/acme"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Website</label>
              <input
                type="url"
                value={newCompetitor.website || ''}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="https://acme.com"
              />
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Notes</label>
              <input
                type="text"
                value={newCompetitor.notes || ''}
                onChange={(e) => setNewCompetitor(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                placeholder="Optional notes"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleAddCompetitor}
              disabled={!newCompetitor.name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              Add Competitor
            </button>
          </div>
        </div>
      )}

      {/* Pending Approvals Section */}
      {pendingCompetitors.length > 0 && (
        <div className="border border-amber-500/30 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('pending')}
            className="w-full flex items-center justify-between p-4 bg-amber-500/10 hover:bg-amber-500/15 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.pending ? (
                <ChevronDown className="w-4 h-4 text-amber-400" />
              ) : (
                <ChevronRight className="w-4 h-4 text-amber-400" />
              )}
              <span className="text-amber-400 font-medium">
                Pending Approval ({pendingCompetitors.length})
              </span>
            </div>
            {pendingCompetitors.length > 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleBulkApprove(); }}
                className="px-3 py-1 text-xs bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
              >
                Approve All
              </button>
            )}
          </button>
          
          {expandedSections.pending && (
            <div className="p-4 space-y-3">
              {pendingCompetitors.map(c => renderCompetitorCard(c, true))}
            </div>
          )}
        </div>
      )}

      {/* Approved Competitors Section */}
      <div className="border border-zinc-700/50 rounded-lg overflow-hidden">
        <button
          onClick={() => toggleSection('approved')}
          className="w-full flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800/80 transition-colors"
        >
          <div className="flex items-center gap-2">
            {expandedSections.approved ? (
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-zinc-400" />
            )}
            <span className="text-zinc-300 font-medium">
              Active Competitors ({approvedCompetitors.length})
            </span>
          </div>
        </button>
        
        {expandedSections.approved && (
          <div className="p-4 space-y-3">
            {approvedCompetitors.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-4">
                No competitors added yet. Use AI suggestions or add manually.
              </p>
            ) : (
              approvedCompetitors.map(c => renderCompetitorCard(c))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorManager;
