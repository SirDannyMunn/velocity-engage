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
  Pause,
  Users,
  BarChart3,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { leadWatcherApi } from '../api/lead-watcher-api';
import { IcpProfile } from '../types/lead-watcher-types';

// shadcn components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// CVA variants
import {
  pageHeaderVariants,
  headerIconVariants,
  statusBadgeVariants,
  emptyStateVariants,
} from '../styles/variants';

interface IcpProfilesListProps {
  onNavigate?: (page: string, params?: Record<string, string>) => void;
}

export function IcpProfilesList({ onNavigate }: IcpProfilesListProps) {
  const [profiles, setProfiles] = useState<IcpProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      <div className={pageHeaderVariants()}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={headerIconVariants({ color: 'primary' })}>
                <Target className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">ICP Profiles</h1>
                <p className="text-sm text-muted-foreground">
                  Define your Ideal Customer Profiles for lead discovery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => loadProfiles()}>
                <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              </Button>

              <Button onClick={handleCreate}>
                <Plus className="w-5 h-5" />
                Create ICP Profile
              </Button>
            </div>
          </div>
        </div>
      </div>
      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {loading && profiles.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Loader2 className="animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadProfiles()}>
              Retry
            </Button>
          </div>
        ) : profiles.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Target className="text-muted-foreground" />
            <p className="text-muted-foreground">No ICP profiles yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first Ideal Customer Profile to start finding leads
            </p>
            <Button onClick={handleCreate}>
              <Plus className="w-5 h-5" />
              Create ICP Profile
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card
                key={profile.id}
                className={cn(
                  'relative group transition-all hover:bg-muted/50',
                  profile.is_active && 'border-primary/30 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
                )}
              >
                <CardHeader className="pb-2">
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    <button
                      onClick={() => handleToggleActive(profile)}
                      className={statusBadgeVariants({
                        status: profile.is_active ? 'active' : 'paused',
                      })}
                    >
                      {profile.is_active ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
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

                  <CardTitle className="text-lg pr-20">{profile.name}</CardTitle>
                  <CardDescription>{getDefinitionSummary(profile)}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {getDefinitionTags(profile).map((tag, index) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    {getDefinitionTags(profile).length === 0 && (
                      <span className="text-muted-foreground text-sm italic">
                        No targeting criteria
                      </span>
                    )}
                  </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {profile.stats?.leads_matched ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Leads Matched</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {profile.stats?.avg_score ?? 0}
                      </p>
                      <p className="text-xs text-muted-foreground">Avg Score</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(profile.id)}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(profile.id)}
                          disabled={duplicating === profile.id}
                        >
                          {duplicating === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => handleDelete(profile.id)}
                          disabled={deleting === profile.id}
                        >
                          {deleting === profile.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IcpProfilesList;
