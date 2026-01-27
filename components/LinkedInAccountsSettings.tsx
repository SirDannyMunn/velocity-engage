/**
 * LinkedInAccountsSettings Component
 * Manage LinkedIn accounts for lead discovery and outreach
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Linkedin,
  PlusCircle,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
  Trash2,
  Settings,
  Shield,
  Activity,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '@/components/ui/utils';
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  LinkedInAccount,
  LinkedInAccountStatus,
  formatRelativeTime,
} from '../types/lead-watcher-types';

// shadcn components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

// CVA variants
import { pageHeaderVariants, headerIconVariants, emptyStateVariants, statusBadgeVariants } from '../styles/variants';

interface LinkedInAccountsSettingsProps {
  onNavigate?: (page: string) => void;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-gray-400',
    bg: 'bg-white/10',
  },
  connected: {
    label: 'Connected',
    icon: CheckCircle,
    color: 'text-[#10b981]',
    bg: 'bg-[#10b981]/20',
  },
  disconnected: {
    label: 'Disconnected',
    icon: XCircle,
    color: 'text-gray-400',
    bg: 'bg-white/10',
  },
  connecting: {
    label: 'Connecting...',
    icon: Loader2,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
  rate_limited: {
    label: 'Rate Limited',
    icon: AlertTriangle,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
  },
  needs_verification: {
    label: 'Verification Required',
    icon: Shield,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
  requires_verification: {
    label: 'Verification Required',
    icon: Shield,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
  requires_2fa: {
    label: 'Requires 2FA',
    icon: Shield,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
  },
  suspended: {
    label: 'Suspended',
    icon: XCircle,
    color: 'text-red-400',
    bg: 'bg-red-500/20',
  },
  warming_up: {
    label: 'Warming Up',
    icon: TrendingUp,
    color: 'text-blue-400',
    bg: 'bg-blue-500/20',
  },
};

// Default config for unknown statuses
const DEFAULT_STATUS_CONFIG = {
  label: 'Unknown',
  icon: AlertCircle,
  color: 'text-gray-400',
  bg: 'bg-white/10',
};

export function LinkedInAccountsSettings({ onNavigate }: LinkedInAccountsSettingsProps) {
  const [accounts, setAccounts] = useState<LinkedInAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedAccountId, setExpandedAccountId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  const loadAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await leadWatcherApi.listLinkedInAccounts();
      setAccounts(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to load accounts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this account?')) return;

    setActionLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      await leadWatcherApi.disconnectLinkedInAccount(accountId);
      setAccounts((prev) =>
        prev.map((a) =>
          a.id === accountId ? { ...a, status: 'disconnected' as LinkedInAccountStatus } : a
        )
      );
    } catch (err: any) {
      console.error('Failed to disconnect account:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleDelete = async (accountId: string) => {
    if (!confirm('Are you sure you want to delete this account? This cannot be undone.')) return;

    setActionLoading((prev) => ({ ...prev, [accountId]: true }));
    try {
      await leadWatcherApi.deleteLinkedInAccount(accountId);
      setAccounts((prev) => prev.filter((a) => a.id !== accountId));
    } catch (err: any) {
      console.error('Failed to delete account:', err);
    } finally {
      setActionLoading((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleReconnect = async (accountId: string) => {
    // For reconnecting, we need to open the modal again to re-enter credentials
    // For now, just reload accounts and show modal
    setShowAddModal(true);
    // Alternatively, you could implement a dedicated reconnect flow
    // that pre-fills the email from the existing account
  };

  if (loading) {
    return (
      <div className={emptyStateVariants()}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className={pageHeaderVariants()}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={headerIconVariants({ gradient: 'blue' })}>
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">LinkedIn Accounts</h1>
                <p className="text-sm text-muted-foreground">
                  {accounts.length} accounts • {accounts.filter((a) => a.status === 'connected').length} connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => loadAccounts()}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <PlusCircle className="w-4 h-4" />
                Add Account
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <div className={emptyStateVariants()}>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => loadAccounts()}>
              Retry
            </Button>
          </div>
        ) : accounts.length === 0 ? (
          <div className={emptyStateVariants()}>
            <Linkedin className="w-16 h-16 text-muted-foreground/50" />
            <p className="text-xl font-medium">No LinkedIn accounts</p>
            <p className="text-muted-foreground text-center max-w-md">
              Connect a LinkedIn account to start discovering leads
            </p>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <PlusCircle className="w-5 h-5" />
              Add Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => {
              const statusConfig = STATUS_CONFIG[account.status] || DEFAULT_STATUS_CONFIG;
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedAccountId === account.id;
              const isLoading = actionLoading[account.id];

              return (
                <Card key={account.id} className="overflow-hidden">
                  {/* Account Header */}
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <Avatar className="w-14 h-14 rounded-xl">
                            <AvatarImage src={account.profile_image_url} alt={account.name} />
                            <AvatarFallback className="rounded-xl bg-gradient-to-br from-[#0077B5] to-blue-600">
                              <Linkedin className="w-7 h-7 text-white" />
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={cn(
                              'absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center',
                              statusConfig.bg
                            )}
                          >
                            <StatusIcon className={cn('w-3 h-3', statusConfig.color)} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{account.name}</h3>
                          <p className="text-muted-foreground text-sm">{account.email}</p>
                          <Badge variant="outline" className={cn('mt-1 text-xs', statusConfig.color)}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {account.status === 'connected' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDisconnect(account.id)}
                            disabled={isLoading}
                          >
                            Disconnect
                          </Button>
                        )}
                        {account.status === 'disconnected' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconnect(account.id)}
                            disabled={isLoading}
                          >
                            Reconnect
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
                          disabled={isLoading}
                          className="bg-destructive/10 text-destructive hover:bg-destructive/20"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Daily Limit</p>
                        <p className="font-semibold">
                          {account.rate_limits?.daily_used || 0} / {account.rate_limits?.daily_limit || 100}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Weekly Limit</p>
                        <p className="font-semibold">
                          {account.rate_limits?.weekly_used || 0} / {account.rate_limits?.weekly_limit || 500}
                        </p>
                      </div>
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Warmup Level</p>
                        <div className="flex items-center gap-2">
                          <Progress value={account.warmup_progress || 0} className="h-2 flex-1" />
                          <span className="text-sm font-medium">
                            {account.warmup_progress || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <Collapsible open={isExpanded} onOpenChange={() => setExpandedAccountId(isExpanded ? null : account.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full border-t border-border pt-3 rounded-none">
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4 mr-1" />
                              Hide Details
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4 mr-1" />
                              Show Details
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="border-t border-border p-5 bg-muted/30">
                        <div className="space-y-6">
                          {/* Rate Limits Section */}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <Activity className="w-4 h-4" />
                              Rate Limits
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Daily Actions</p>
                                <div className="flex items-center gap-2">
                                  <Progress 
                                    value={((account.rate_limits?.daily_used || 0) / (account.rate_limits?.daily_limit || 100)) * 100}
                                    className={cn(
                                      'h-2 flex-1',
                                      (account.rate_limits?.daily_used || 0) / (account.rate_limits?.daily_limit || 100) > 0.8 && '[&>div]:bg-yellow-500'
                                    )}
                                  />
                                  <span className="text-sm">
                                    {account.rate_limits?.daily_used || 0}/{account.rate_limits?.daily_limit || 100}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">Weekly Actions</p>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={((account.rate_limits?.weekly_used || 0) / (account.rate_limits?.weekly_limit || 500)) * 100}
                                    className={cn(
                                      'h-2 flex-1',
                                      (account.rate_limits?.weekly_used || 0) / (account.rate_limits?.weekly_limit || 500) > 0.8 && '[&>div]:bg-yellow-500'
                                    )}
                                  />
                                  <span className="text-sm">
                                    {account.rate_limits?.weekly_used || 0}/{account.rate_limits?.weekly_limit || 500}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {account.rate_limits?.reset_at && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Resets {formatRelativeTime(account.rate_limits.reset_at)}
                              </p>
                            )}
                          </div>

                          {/* Warmup Settings */}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4" />
                              Warmup Progress
                            </h4>
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-muted-foreground">Progress</span>
                                <span className="font-medium">
                                  {account.warmup_progress || 0}%
                                </span>
                              </div>
                              <Progress value={account.warmup_progress || 0} className="h-3 mb-3" />
                              <p className="text-xs text-muted-foreground">
                                {(account.warmup_progress || 0) < 100
                                  ? 'Account is warming up. Actions are limited to protect your account.'
                                  : 'Warmup complete! Full action limits are now available.'}
                              </p>
                            </div>
                          </div>

                          {/* Session Info */}
                          <div>
                            <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Session Info
                            </h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Connected</span>
                                <span>
                                  {account.connected_at
                                    ? formatRelativeTime(account.connected_at)
                                    : 'Never'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Last Active</span>
                                <span>
                                  {account.last_active_at
                                    ? formatRelativeTime(account.last_active_at)
                                    : 'Never'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">TOTP Enabled</span>
                                <span className={account.totp_enabled ? 'text-primary' : 'text-muted-foreground'}>
                                  {account.totp_enabled ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between p-2 bg-muted rounded-lg">
                                <span className="text-muted-foreground">Premium</span>
                                <span className={account.is_premium ? 'text-yellow-500' : 'text-muted-foreground'}>
                                  {account.is_premium ? 'Yes' : 'No'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 pt-2">
                            <Button variant="outline" className="flex-1 gap-2">
                              <Settings className="w-4 h-4" />
                              Settings
                            </Button>
                            <Button variant="outline" className="gap-2">
                              <Activity className="w-4 h-4" />
                              View Activity
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Connect LinkedIn Account</DialogTitle>
            <DialogDescription>
              Add your LinkedIn credentials to start discovering leads
            </DialogDescription>
          </DialogHeader>
          <AddAccountModalContent
            onClose={() => setShowAddModal(false)}
            onAdded={(account) => {
              setAccounts((prev) => [...prev, account]);
              setShowAddModal(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Add Account Modal Content Component
interface AddAccountModalContentProps {
  onClose: () => void;
  onAdded: (account: LinkedInAccount) => void;
}

function AddAccountModalContent({ onClose, onAdded }: AddAccountModalContentProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpSecret, setTotpSecret] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'credentials' | 'totp_setup' | 'connecting'>('credentials');
  const [createdAccount, setCreatedAccount] = useState<LinkedInAccount | null>(null);
  const [totpCode, setTotpCode] = useState<string>('');
  const [totpSecondsRemaining, setTotpSecondsRemaining] = useState(30);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'success' | 'failed'>('idle');
  const [liveUrl, setLiveUrl] = useState<string | null>(null);

  // Fetch TOTP code periodically when on totp_setup step
  useEffect(() => {
    if (step !== 'totp_setup' || !createdAccount?.id) return;

    const fetchTotpCode = async () => {
      try {
        const response = await leadWatcherApi.getTotpCode(createdAccount.id);
        setTotpCode(response.code);
        setTotpSecondsRemaining(response.valid_for_seconds);
      } catch (err) {
        console.error('Failed to fetch TOTP code:', err);
      }
    };

    // Fetch immediately
    fetchTotpCode();

    // Refresh every second to update countdown, fetch new code when needed
    const interval = setInterval(() => {
      setTotpSecondsRemaining(prev => {
        if (prev <= 1) {
          fetchTotpCode();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [step, createdAccount?.id]);

  const handleSubmitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter email');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await leadWatcherApi.createLinkedInAccount({
        email: email.trim(),
        password: password.trim() || undefined,
        totp_secret: totpSecret.trim() || undefined,
      });

      setCreatedAccount(response.data);

      // If TOTP secret was provided, show the 2FA setup step
      if (totpSecret.trim()) {
        setStep('totp_setup');
      } else {
        // No 2FA, proceed to manual connection or finish
        onAdded(response.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create account');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!createdAccount) return;

    setConnectionStatus('connecting');
    setError(null);

    try {
      // Trigger the login job/automation
      await leadWatcherApi.connectLinkedInAccount(createdAccount.id, {});
      
      // Poll for status update
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      
      const pollStatus = async () => {
        const response = await leadWatcherApi.getLinkedInAccount(createdAccount.id);
        if (response.data.status === 'connected') {
          setConnectionStatus('success');
          setCreatedAccount(response.data);
          return true;
        } else if (response.data.status === 'error' || response.data.status === 'disconnected') {
          setConnectionStatus('failed');
          setError(response.data.error_message || 'Connection failed');
          return true;
        }
        return false;
      };

      const interval = setInterval(async () => {
        attempts++;
        const done = await pollStatus();
        if (done || attempts >= maxAttempts) {
          clearInterval(interval);
          if (attempts >= maxAttempts && connectionStatus === 'connecting') {
            setConnectionStatus('failed');
            setError('Connection timed out. Please try again.');
          }
        }
      }, 5000);

    } catch (err: any) {
      setConnectionStatus('failed');
      setError(err.message || 'Failed to connect');
    }
  };

  const handleStartManualConnect = async () => {
    if (!createdAccount) return;

    setError(null);
    try {
      const response = await leadWatcherApi.startManualConnect(createdAccount.id);
      setLiveUrl(response.live_url);
      setStep('connecting');
    } catch (err: any) {
      setError(err.message || 'Failed to start manual connection');
    }
  };

  const handleFinishManualConnect = async () => {
    if (!createdAccount) return;

    setSaving(true);
    setError(null);
    try {
      const response = await leadWatcherApi.confirmManualConnect(createdAccount.id);
      if (response.success) {
        const accountResponse = await leadWatcherApi.getLinkedInAccount(createdAccount.id);
        onAdded(accountResponse.data);
      } else {
        setError(response.message || 'Could not verify login');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setSaving(false);
    }
  };

  const handleComplete = () => {
    if (createdAccount) {
      onAdded(createdAccount);
    } else {
      onClose();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-5">
      {step === 'credentials' ? (
        <form onSubmit={handleSubmitCredentials} className="space-y-5">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="linkedin-email">LinkedIn Email</Label>
            <Input
              id="linkedin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkedin-password">Password</Label>
            <div className="relative">
              <Input
                id="linkedin-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-full"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totp-secret">TOTP Secret (Optional)</Label>
            <Input
              id="totp-secret"
              type="text"
              value={totpSecret}
              onChange={(e) => setTotpSecret(e.target.value)}
              placeholder="For 2FA accounts"
            />
            <p className="text-xs text-muted-foreground">
              If your account has 2FA enabled, enter your TOTP secret key
            </p>
          </div>

          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-yellow-500 font-medium">Security Notice</p>
                <p className="text-yellow-500/80 mt-1">
                  Your credentials are encrypted and stored securely. We recommend using an account
                  created specifically for automation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="flex-1 gap-2">
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Linkedin className="w-4 h-4" />
                  Connect
                </>
              )}
            </Button>
          </div>
        </form>
      ) : step === 'totp_setup' ? (
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center">
            <Shield className="w-10 h-10 text-blue-500 mx-auto mb-2" />
            <p className="text-blue-500 font-medium">Complete 2FA Setup</p>
            <p className="text-sm text-muted-foreground mt-1">
              Enter this code in LinkedIn to verify your authenticator
            </p>
          </div>

          {/* Live TOTP Code Display */}
          <div className="relative">
            <div className="p-6 bg-muted border border-border rounded-xl text-center">
              <p className="text-4xl font-mono font-bold tracking-[0.5em] mb-2">
                {totpCode || '------'}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>Expires in {totpSecondsRemaining}s</span>
              </div>
              <Progress value={(totpSecondsRemaining / 30) * 100} className="mt-3 h-1" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => copyToClipboard(totpCode)}
              className="absolute top-2 right-2"
              title="Copy code"
            >
              <Zap className="w-4 h-4" />
            </Button>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <div className="text-sm text-blue-500">
              <p className="font-medium mb-1">Instructions:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-500/80">
                <li>Go to LinkedIn → Settings → Security → 2FA</li>
                <li>Choose "Authenticator App"</li>
                <li>When prompted, enter the code above</li>
                <li>Click "Test Connection" when done</li>
              </ol>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2">
            {connectionStatus === 'success' ? (
              <div className="p-3 bg-primary/10 border border-primary/50 rounded-lg text-center">
                <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-primary font-medium">Connected Successfully!</p>
              </div>
            ) : connectionStatus === 'connecting' ? (
              <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg text-center">
                <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                <p className="text-blue-500">Testing connection...</p>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleComplete}>
                {connectionStatus === 'success' ? 'Done' : 'Skip for Now'}
              </Button>
              {connectionStatus !== 'success' && (
                <Button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'connecting'}
                  className="flex-1 gap-2"
                >
                  {connectionStatus === 'connecting' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </Button>
              )}
            </div>

            {connectionStatus === 'failed' && (
              <Button
                type="button"
                variant="outline"
                onClick={handleStartManualConnect}
                className="w-full text-orange-500 hover:text-orange-500"
              >
                Try Manual Login Instead
              </Button>
            )}
          </div>
        </div>
      ) : step === 'connecting' ? (
        <div className="space-y-5">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/50 rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          {liveUrl ? (
            <>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden border border-border">
                <iframe
                  src={liveUrl}
                  className="w-full h-full"
                  allow="clipboard-write"
                  title="LinkedIn Login"
                />
              </div>

              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-500">
                <p className="font-medium mb-1">Log in to LinkedIn in the browser above</p>
                <p className="text-blue-500/70">
                  Complete any security challenges, then click "I'm Done" below.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleFinishManualConnect}
                  disabled={saving}
                  className="flex-1 gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      I'm Done
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Starting browser session...</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

export default LinkedInAccountsSettings;
