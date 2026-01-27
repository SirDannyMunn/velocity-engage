/**
 * IcpProfilesList Component
 * Card grid showing ICP profiles with stats and actions
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Target,
  Plus,
  MoreHorizontal,
  Edit2,
  Copy,
  Trash2,
  Play,
  Pause,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
  Check,
} from 'lucide-react';
import { leadWatcherApi } from '../api/lead-watcher-api';
import { IcpProfile } from '../types/lead-watcher-types';

interface IcpProfilesListProps {
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}

export function IcpProfilesList({ onNavigate }: IcpProfilesListProps) {
  const [profiles, setProfiles] = useState<IcpProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leadWatcherApi.listIcpProfiles();
      setProfiles(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load ICP profiles');
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfiles();
  }, [loadProfiles]);

  const handleToggleActive = async (profile: IcpProfile) => {
    try {
      await leadWatcherApi.toggleIcpProfileActive(profile.id, !profile.is_active);
      setProfiles((prev) =>
        prev.map((p) =>
          p.id === profile.id ? { ...p, is_active: !p.is_active } : p
        )
      );
    } catch (err) {
      console.error('Failed to toggle profile:', err);
    }
  };

  const handleDuplicate = async (profileId: string) => {
    setDuplicating(profileId);
    try {
      const response = await leadWatcherApi.duplicateIcpProfile(profileId);
      setProfiles((prev) => [...prev, response.data]);
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to duplicate profile:', err);
    } finally {
      setDuplicating(null);
    }
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this ICP profile?')) return;
    setDeleting(profileId);
    try {
      await leadWatcherApi.deleteIcpProfile(profileId);
      setProfiles((prev) => prev.filter((p) => p.id !== profileId));
      setOpenMenuId(null);
    } catch (err) {
      console.error('Failed to delete profile:', err);
    } finally {
      setDeleting(null);
    }
  };

  const handleEdit = (profileId: string) => {
    onNavigate?.('engage-icp-edit', { id: profileId });
  };

  const handleCreate = () => {
    onNavigate?.('engage-icp-edit', { id: 'new' });
  };

  const getDefinitionSummary = (profile: IcpProfile) => {
    const parts: string[] = [];
    const def = profile.definition || {};
    
    if (def.titles?.length) {
      parts.push(`${def.titles.length} job title${def.titles.length > 1 ? 's' : ''}`);
    }
    if (def.industries?.length) {
      parts.push(`${def.industries.length} industr${def.industries.length > 1 ? 'ies' : 'y'}`);
    }
    if (def.locations?.length) {
      parts.push(`${def.locations.length} location${def.locations.length > 1 ? 's' : ''}`);
    }
    if (def.company_sizes?.length) {
      parts.push(`${def.company_sizes.length} company size${def.company_sizes.length > 1 ? 's' : ''}`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : 'No criteria defined';
  };

  const getDefinitionTags = (profile: IcpProfile) => {
    const tags: string[] = [];
    const def = profile.definition || {};
    
    if (def.titles?.length) {
      tags.push(...def.titles.slice(0, 2));
    }
    if (def.industries?.length) {
      tags.push(...def.industries.slice(0, 2));
    }
    
    return tags.slice(0, 4);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10b981] to-emerald-600 flex items-center justify-center">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">ICP Profiles</h1>
                <p className="text-sm text-gray-400">
                  Define your Ideal Customer Profiles for lead discovery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadProfiles()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleCreate}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
              >
                <Plus className="w-5 h-5" />
                Create ICP Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && profiles.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => loadProfiles()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : profiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Target className="w-12 h-12 text-gray-600" />
            <p className="text-gray-400">No ICP profiles yet</p>
            <p className="text-sm text-gray-500">
              Create your first Ideal Customer Profile to start finding leads
            </p>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-500 hover:from-[#0d9668] hover:to-emerald-600 text-white font-semibold rounded-lg transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40"
            >
              <Plus className="w-5 h-5" />
              Create ICP Profile
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className={`relative group bg-white/5 border rounded-2xl p-5 transition-all hover:bg-white/10 ${
                  profile.is_active
                    ? 'border-[#10b981]/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                    : 'border-white/10'
                }`}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => handleToggleActive(profile)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      profile.is_active
                        ? 'bg-[#10b981]/20 text-[#10b981]'
                        : 'bg-gray-500/20 text-gray-400'
                    }`}
                  >
                    {profile.is_active ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="w-3 h-3" />
                        Inactive
                      </>
                    )}
                  </button>
                </div>

                {/* Header */}
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white pr-20">
                    {profile.name}
                  </h3>
                  <p className="text-sm text-gray-400 mt-1">
                    {getDefinitionSummary(profile)}
                  </p>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {getDefinitionTags(profile).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-white/5 text-gray-300 rounded-lg text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                  {getDefinitionTags(profile).length === 0 && (
                    <span className="text-gray-500 text-sm italic">
                      No targeting criteria
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {profile.stats?.leads_matched ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Leads Matched</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {profile.stats?.avg_score ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Avg Score</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleEdit(profile.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-sm transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === profile.id ? null : profile.id);
                      }}
                      className="p-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-lg transition-colors"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>

                    {openMenuId === profile.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-card border border-border rounded-xl shadow-2xl z-20 overflow-hidden">
                        <button
                          onClick={() => handleDuplicate(profile.id)}
                          disabled={duplicating === profile.id}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          {duplicating === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          Duplicate
                        </button>
                        <button
                          onClick={() => handleDelete(profile.id)}
                          disabled={deleting === profile.id}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          {deleting === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  );
}

export default IcpProfilesList;
