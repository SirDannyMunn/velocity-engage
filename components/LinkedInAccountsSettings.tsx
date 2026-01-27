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
import { leadWatcherApi } from '../api/lead-watcher-api';
import {
  LinkedInAccount,
  LinkedInAccountStatus,
  formatRelativeTime,
} from '../types/lead-watcher-types';

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
      <div className="flex-1 flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex-shrink-0 border-b-[0.5px] border-border/15 bg-card/80 backdrop-blur-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0077B5] to-blue-600 flex items-center justify-center">
                <Linkedin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">LinkedIn Accounts</h1>
                <p className="text-sm text-gray-400">
                  {accounts.length} accounts • {accounts.filter((a) => a.status === 'connected').length} connected
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadAccounts()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#0077B5] to-blue-600 hover:from-[#0077B5]/90 hover:to-blue-600/90 text-white font-medium rounded-lg transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                Add Account
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-gray-400">{error}</p>
            <button
              onClick={() => loadAccounts()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
            >
              Retry
            </button>
          </div>
        ) : accounts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <Linkedin className="w-16 h-16 text-gray-600" />
            <p className="text-xl font-medium text-white">No LinkedIn accounts</p>
            <p className="text-gray-400 text-center max-w-md">
              Connect a LinkedIn account to start discovering leads
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#0077B5] to-blue-600 text-white font-medium rounded-lg hover:from-[#0077B5]/90 hover:to-blue-600/90 transition-colors"
            >
              <PlusCircle className="w-5 h-5" />
              Add Account
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => {
              const statusConfig = STATUS_CONFIG[account.status] || DEFAULT_STATUS_CONFIG;
              const StatusIcon = statusConfig.icon;
              const isExpanded = expandedAccountId === account.id;
              const isLoading = actionLoading[account.id];

              return (
                <div
                  key={account.id}
                  className="bg-white/5 rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Account Header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          {account.profile_image_url ? (
                            <img
                              src={account.profile_image_url}
                              alt={account.name}
                              className="w-14 h-14 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#0077B5] to-blue-600 flex items-center justify-center">
                              <Linkedin className="w-7 h-7 text-white" />
                            </div>
                          )}
                          <div
                            className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${statusConfig.bg} flex items-center justify-center`}
                          >
                            <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-lg">{account.name}</h3>
                          <p className="text-gray-400 text-sm">{account.email}</p>
                          <div className={`flex items-center gap-1.5 text-sm mt-1 ${statusConfig.color}`}>
                            <span>{statusConfig.label}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {account.status === 'connected' && (
                          <button
                            onClick={() => handleDisconnect(account.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-white/5 text-gray-400 rounded-lg hover:bg-white/10 hover:text-white transition-colors disabled:opacity-50"
                          >
                            Disconnect
                          </button>
                        )}
                        {account.status === 'disconnected' && (
                          <button
                            onClick={() => handleReconnect(account.id)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-[#0077B5]/20 text-[#0077B5] rounded-lg hover:bg-[#0077B5]/30 transition-colors disabled:opacity-50"
                          >
                            Reconnect
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(account.id)}
                          disabled={isLoading}
                          className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Daily Limit</p>
                        <p className="font-semibold text-white">
                          {account.rate_limits?.daily_used || 0} / {account.rate_limits?.daily_limit || 100}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Weekly Limit</p>
                        <p className="font-semibold text-white">
                          {account.rate_limits?.weekly_used || 0} / {account.rate_limits?.weekly_limit || 500}
                        </p>
                      </div>
                      <div className="p-3 bg-white/5 rounded-lg">
                        <p className="text-xs text-gray-400 mb-1">Warmup Level</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#10b981] rounded-full"
                              style={{ width: `${account.warmup_progress || 0}%` }}
                            />
                          </div>
                          <span className="text-white text-sm font-medium">
                            {account.warmup_progress || 0}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => setExpandedAccountId(isExpanded ? null : account.id)}
                      className="flex items-center justify-center w-full pt-3 border-t border-white/10 text-gray-400 hover:text-white transition-colors"
                    >
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
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-white/10 p-5 bg-black/20">
                      <div className="space-y-6">
                        {/* Rate Limits Section */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Rate Limits
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Daily Actions</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      (account.rate_limits?.daily_used || 0) / (account.rate_limits?.daily_limit || 100) > 0.8
                                        ? 'bg-yellow-500'
                                        : 'bg-[#10b981]'
                                    }`}
                                    style={{
                                      width: `${
                                        ((account.rate_limits?.daily_used || 0) /
                                          (account.rate_limits?.daily_limit || 100)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-white">
                                  {account.rate_limits?.daily_used || 0}/{account.rate_limits?.daily_limit || 100}
                                </span>
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 mb-1">Weekly Actions</p>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      (account.rate_limits?.weekly_used || 0) / (account.rate_limits?.weekly_limit || 500) > 0.8
                                        ? 'bg-yellow-500'
                                        : 'bg-[#10b981]'
                                    }`}
                                    style={{
                                      width: `${
                                        ((account.rate_limits?.weekly_used || 0) /
                                          (account.rate_limits?.weekly_limit || 500)) *
                                        100
                                      }%`,
                                    }}
                                  />
                                </div>
                                <span className="text-sm text-white">
                                  {account.rate_limits?.weekly_used || 0}/{account.rate_limits?.weekly_limit || 500}
                                </span>
                              </div>
                            </div>
                          </div>
                          {account.rate_limits?.reset_at && (
                            <p className="text-xs text-gray-500 mt-2">
                              Resets {formatRelativeTime(account.rate_limits.reset_at)}
                            </p>
                          )}
                        </div>

                        {/* Warmup Settings */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Warmup Progress
                          </h4>
                          <div className="p-4 bg-white/5 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-gray-400">Progress</span>
                              <span className="font-medium text-white">
                                {account.warmup_progress || 0}%
                              </span>
                            </div>
                            <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                              <div
                                className="h-full bg-gradient-to-r from-[#10b981] to-emerald-400 rounded-full transition-all"
                                style={{ width: `${account.warmup_progress || 0}%` }}
                              />
                            </div>
                            <p className="text-xs text-gray-500">
                              {(account.warmup_progress || 0) < 100
                                ? 'Account is warming up. Actions are limited to protect your account.'
                                : 'Warmup complete! Full action limits are now available.'}
                            </p>
                          </div>
                        </div>

                        {/* Session Info */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                            <Shield className="w-4 h-4" />
                            Session Info
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Connected</span>
                              <span className="text-white">
                                {account.connected_at
                                  ? formatRelativeTime(account.connected_at)
                                  : 'Never'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Last Active</span>
                              <span className="text-white">
                                {account.last_active_at
                                  ? formatRelativeTime(account.last_active_at)
                                  : 'Never'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">TOTP Enabled</span>
                              <span className={account.totp_enabled ? 'text-[#10b981]' : 'text-gray-500'}>
                                {account.totp_enabled ? 'Yes' : 'No'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                              <span className="text-gray-400">Premium</span>
                              <span className={account.is_premium ? 'text-yellow-400' : 'text-gray-500'}>
                                {account.is_premium ? 'Yes' : 'No'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                          <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                            <Settings className="w-4 h-4" />
                            Settings
                          </button>
                          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors">
                            <Activity className="w-4 h-4" />
                            View Activity
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Account Modal */}
      {showAddModal && (
        <AddAccountModal
          onClose={() => setShowAddModal(false)}
          onAdded={(account) => {
            setAccounts((prev) => [...prev, account]);
            setShowAddModal(false);
          }}
        />
      )}
    </div>
  );
}

// Add Account Modal Component
interface AddAccountModalProps {
  onClose: () => void;
  onAdded: (account: LinkedInAccount) => void;
}

function AddAccountModal({ onClose, onAdded }: AddAccountModalProps) {
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 w-full max-w-md overflow-hidden">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0077B5] to-blue-600 flex items-center justify-center">
              <Linkedin className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {step === 'credentials' && 'Connect LinkedIn Account'}
                {step === 'totp_setup' && '2FA Setup'}
                {step === 'connecting' && 'Manual Login'}
              </h2>
              <p className="text-sm text-gray-400 mt-0.5">
                {step === 'credentials' && 'Enter your LinkedIn credentials'}
                {step === 'totp_setup' && 'Complete 2FA setup in LinkedIn'}
                {step === 'connecting' && 'Log in to LinkedIn manually'}
              </p>
            </div>
          </div>
        </div>

        {step === 'credentials' ? (
          <form onSubmit={handleSubmitCredentials} className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                LinkedIn Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0077B5]/50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0077B5]/50 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                TOTP Secret (Optional)
              </label>
              <input
                type="text"
                value={totpSecret}
                onChange={(e) => setTotpSecret(e.target.value)}
                placeholder="For 2FA accounts"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:border-[#0077B5]/50"
              />
              <p className="text-xs text-gray-500 mt-1">
                If your account has 2FA enabled, enter your TOTP secret key
              </p>
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-400 font-medium">Security Notice</p>
                  <p className="text-yellow-500/80 mt-1">
                    Your credentials are encrypted and stored securely. We recommend using an account
                    created specifically for automation.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#0077B5] to-blue-600 hover:from-[#0077B5]/90 hover:to-blue-600/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Linkedin className="w-4 h-4" />
                    Connect
                  </>
                )}
              </button>
            </div>
          </form>
        ) : step === 'totp_setup' ? (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="p-4 bg-[#0077B5]/10 border border-[#0077B5]/30 rounded-lg text-center">
              <Shield className="w-10 h-10 text-[#0077B5] mx-auto mb-2" />
              <p className="text-[#0077B5] font-medium">Complete 2FA Setup</p>
              <p className="text-sm text-gray-400 mt-1">
                Enter this code in LinkedIn to verify your authenticator
              </p>
            </div>

            {/* Live TOTP Code Display */}
            <div className="relative">
              <div className="p-6 bg-white/5 border border-white/20 rounded-xl text-center">
                <p className="text-4xl font-mono font-bold text-white tracking-[0.5em] mb-2">
                  {totpCode || '------'}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>Expires in {totpSecondsRemaining}s</span>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] transition-all duration-1000"
                    style={{ width: `${(totpSecondsRemaining / 30) * 100}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(totpCode)}
                className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Copy code"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <div className="text-sm text-blue-400">
                <p className="font-medium mb-1">Instructions:</p>
                <ol className="list-decimal list-inside space-y-1 text-blue-400/80">
                  <li>Go to LinkedIn → Settings → Security → 2FA</li>
                  <li>Choose "Authenticator App"</li>
                  <li>When prompted, enter the code above</li>
                  <li>Click "Test Connection" when done</li>
                </ol>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              {connectionStatus === 'success' ? (
                <div className="p-3 bg-[#10b981]/20 border border-[#10b981]/50 rounded-lg text-center">
                  <CheckCircle className="w-8 h-8 text-[#10b981] mx-auto mb-2" />
                  <p className="text-[#10b981] font-medium">Connected Successfully!</p>
                </div>
              ) : connectionStatus === 'connecting' ? (
                <div className="p-3 bg-blue-500/20 border border-blue-500/50 rounded-lg text-center">
                  <Loader2 className="w-8 h-8 text-blue-400 mx-auto mb-2 animate-spin" />
                  <p className="text-blue-400">Testing connection...</p>
                </div>
              ) : null}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleComplete}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                >
                  {connectionStatus === 'success' ? 'Done' : 'Skip for Now'}
                </button>
                {connectionStatus !== 'success' && (
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={connectionStatus === 'connecting'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-600 hover:from-[#10b981]/90 hover:to-emerald-600/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {connectionStatus === 'connecting' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Zap className="w-4 h-4" />
                        Test Connection
                      </>
                    )}
                  </button>
                )}
              </div>

              {connectionStatus === 'failed' && (
                <button
                  type="button"
                  onClick={handleStartManualConnect}
                  className="w-full px-4 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 rounded-lg transition-colors"
                >
                  Try Manual Login Instead
                </button>
              )}
            </div>
          </div>
        ) : step === 'connecting' ? (
          <div className="p-6 space-y-5">
            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {liveUrl ? (
              <>
                <div className="aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/10">
                  <iframe
                    src={liveUrl}
                    className="w-full h-full"
                    allow="clipboard-write"
                    title="LinkedIn Login"
                  />
                </div>

                <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm text-blue-400">
                  <p className="font-medium mb-1">Log in to LinkedIn in the browser above</p>
                  <p className="text-blue-400/70">
                    Complete any security challenges, then click "I'm Done" below.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleFinishManualConnect}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#10b981] to-emerald-600 hover:from-[#10b981]/90 hover:to-emerald-600/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        I'm Done
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-[#0077B5] mx-auto mb-4" />
                <p className="text-gray-400">Starting browser session...</p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default LinkedInAccountsSettings;
