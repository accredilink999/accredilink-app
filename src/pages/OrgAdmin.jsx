import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { invokeFunction } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { getCurrentOrgId, getCurrentOrg, getCurrentOrgRole } from '@/lib/orgContext';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import OwnerWelcomeModal from '@/components/OwnerWelcomeModal';
import SetupHub from '@/components/admin/SetupHub';
import FeaturePermissions from '@/components/admin/FeaturePermissions';
import DataImport from '@/pages/DataImport';
import LegalPages from '@/pages/LegalPages';
import Archive from '@/pages/Archive';
import Feedback from '@/pages/Feedback';
import StaffAwards from '@/pages/StaffAwards';
import {
  Building2, Users, CreditCard, Settings, Shield, Crown, Copy, Check,
  KeyRound, Loader2, ExternalLink, Calendar, ChevronRight, Download,
  UserPlus, Trash2, ChevronDown, MapPin, Clock, LayoutGrid, Sparkles,
  AlertTriangle, RefreshCw, XCircle, CheckCircle2, Receipt, ListChecks,
  SlidersHorizontal, FileSpreadsheet, Scale, ArchiveIcon, Star, Trophy,
} from 'lucide-react';

const PLAN_LABELS = {
  trial: 'Free Trial', starter: 'Starter', professional: 'Professional',
  enterprise: 'Enterprise', cancelled: 'Cancelled',
};
const PLAN_COLORS = {
  trial: 'bg-yellow-100 text-yellow-800', starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-teal-100 text-teal-800', enterprise: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};
const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', member: 'Staff', viewer: 'Viewer' };
const ROLE_COLORS = {
  owner: 'bg-purple-100 text-purple-800', admin: 'bg-blue-100 text-blue-800',
  member: 'bg-slate-100 text-slate-800', viewer: 'bg-gray-100 text-gray-600',
};

const PLANS = [
  { key: 'starter', name: 'Starter', price: { monthly: 99, annual: 79 }, staff: 'Up to 15 staff', recommended: false },
  { key: 'professional', name: 'Professional', price: { monthly: 199, annual: 159 }, staff: 'Up to 30 staff', recommended: true },
  { key: 'enterprise', name: 'Enterprise', price: { monthly: 349, annual: 279 }, staff: 'Unlimited staff', recommended: false },
];

const CARD_BRANDS = {
  visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex',
  discover: 'Discover', diners: 'Diners', jcb: 'JCB',
};

const TABS = [
  { id: 'setup',       label: 'Setup',       icon: ListChecks,      bg: 'from-teal-500 to-teal-700' },
  { id: 'overview',    label: 'Overview',    icon: Building2,       bg: 'from-blue-500 to-blue-700' },
  { id: 'staff',       label: 'Staff',       icon: Users,           bg: 'from-indigo-500 to-indigo-700' },
  { id: 'permissions', label: 'Permissions', icon: SlidersHorizontal, bg: 'from-violet-500 to-violet-700' },
  { id: 'import',      label: 'Import',      icon: FileSpreadsheet, bg: 'from-emerald-500 to-emerald-700' },
  { id: 'legal',       label: 'Legal',       icon: Scale,           bg: 'from-slate-500 to-slate-700' },
  { id: 'archive',     label: 'Archive',     icon: ArchiveIcon,     bg: 'from-stone-500 to-stone-700' },
  { id: 'feedback',    label: 'Feedback',    icon: Star,            bg: 'from-amber-400 to-amber-600' },
  { id: 'awards',      label: 'Awards',      icon: Trophy,          bg: 'from-yellow-400 to-yellow-600' },
  { id: 'billing',     label: 'Billing',     icon: CreditCard,      bg: 'from-green-500 to-green-700' },
  { id: 'settings',    label: 'Settings',    icon: Settings,        bg: 'from-rose-500 to-rose-700' },
];

export default function OrgAdmin() {
  const { user } = useAuth();
  const orgId = getCurrentOrgId();
  const orgRole = getCurrentOrgRole();
  const queryClient = useQueryClient();
  // Support ?tab= deep-link from Setup Hub
  const initialTab = new URLSearchParams(window.location.search).get('tab') || 'setup';
  const [tab, setTab] = useState(initialTab);
  const [copied, setCopied] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [annual, setAnnual] = useState(false);
  const [changingPlan, setChangingPlan] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [roleChange, setRoleChange] = useState({});

  // Fetch org details
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['orgadmin-org', orgId],
    queryFn: async () => {
      const { data, error } = await supabase.from('organizations').select('*').eq('id', orgId).single();
      if (error) throw error;
      if (data && !companyName) setCompanyName(data.name || '');
      return data;
    },
    enabled: !!orgId,
  });

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ['orgadmin-members', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, role, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      // Fetch profiles for each member
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name, role, job_title')
        .in('id', userIds);
      const profileMap = {};
      (profiles || []).forEach(p => { profileMap[p.id] = p; });
      return data.map(m => ({ ...m, profile: profileMap[m.user_id] || {} }));
    },
    enabled: !!orgId,
  });

  // Fetch billing details from Stripe
  const { data: billing, isLoading: billingLoading, refetch: refetchBilling } = useQuery({
    queryKey: ['orgadmin-billing', orgId],
    queryFn: async () => {
      return await invokeFunction('get-billing-details', { organizationId: orgId });
    },
    enabled: !!orgId && tab === 'billing',
    retry: false,
  });

  // Fetch areas
  const { data: areas = [] } = useQuery({
    queryKey: ['orgadmin-areas', orgId],
    queryFn: async () => {
      const { data } = await supabase.from('rota_areas').select('id, name').eq('organization_id', orgId);
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch quick stats
  const { data: stats } = useQuery({
    queryKey: ['orgadmin-stats', orgId],
    queryFn: async () => {
      const [staffRes, clientRes, shiftRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('service_users').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        supabase.from('shifts').select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .gte('date', new Date().toISOString().slice(0, 10))
          .lte('date', new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10)),
      ]);
      return {
        staff: members.length,
        clients: clientRes.count || 0,
        shiftsThisWeek: shiftRes.count || 0,
        areas: areas.length,
      };
    },
    enabled: !!orgId && members.length > 0,
  });

  const handleCopyInvite = () => {
    if (org?.invite_code) {
      navigator.clipboard.writeText(org.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleChangePlan = async (newPlan) => {
    setChangingPlan(newPlan);
    try {
      const result = await invokeFunction('change-subscription', {
        organizationId: orgId,
        newPlan,
        billing: annual ? 'annual' : 'monthly',
      });
      if (result.success) {
        toast.success(`Plan changed to ${PLAN_LABELS[newPlan]}`);
        queryClient.invalidateQueries({ queryKey: ['orgadmin-billing'] });
        queryClient.invalidateQueries({ queryKey: ['orgadmin-org'] });
      } else {
        toast.error(result.error || 'Failed to change plan');
      }
    } catch (err) {
      // If no subscription yet, redirect to checkout
      if (err.message?.includes('No active subscription')) {
        try {
          const checkout = await invokeFunction('create-checkout-session', {
            plan: newPlan,
            organizationId: orgId,
            billing: annual ? 'annual' : 'monthly',
          });
          if (checkout.url) window.location.href = checkout.url;
        } catch (e2) {
          toast.error('Failed to start checkout: ' + e2.message);
        }
      } else {
        toast.error(err.message || 'Failed to change plan');
      }
    } finally {
      setChangingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    try {
      const result = await invokeFunction('cancel-subscription', {
        organizationId: orgId,
        action: 'cancel',
      });
      if (result.success) {
        toast.success(result.message);
        setCancelConfirm(false);
        refetchBilling();
        queryClient.invalidateQueries({ queryKey: ['orgadmin-org'] });
      } else {
        toast.error(result.error || 'Failed to cancel');
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleReactivate = async () => {
    try {
      const result = await invokeFunction('cancel-subscription', {
        organizationId: orgId,
        action: 'reactivate',
      });
      if (result.success) {
        toast.success(result.message);
        refetchBilling();
        queryClient.invalidateQueries({ queryKey: ['orgadmin-org'] });
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleRoleChange = async (memberId, userId, newRole) => {
    try {
      await supabase.from('organization_members').update({ role: newRole }).eq('id', memberId);
      // Also update profile role
      const profileRole = newRole === 'owner' || newRole === 'admin' ? 'admin' : 'staff';
      await supabase.from('profiles').update({ role: profileRole }).eq('id', userId);
      toast.success('Role updated');
      queryClient.invalidateQueries({ queryKey: ['orgadmin-members'] });
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId, memberName) => {
    if (!confirm(`Remove ${memberName} from your organisation? They will lose access.`)) return;
    try {
      await supabase.from('organization_members').delete().eq('id', memberId);
      toast.success(`${memberName} removed`);
      queryClient.invalidateQueries({ queryKey: ['orgadmin-members'] });
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  const handleSaveCompanyName = async () => {
    if (!companyName.trim()) return;
    setSavingName(true);
    try {
      await supabase.from('organizations').update({ name: companyName.trim() }).eq('id', orgId);
      toast.success('Company name updated');
      queryClient.invalidateQueries({ queryKey: ['orgadmin-org'] });
    } catch {
      toast.error('Failed to save');
    } finally {
      setSavingName(false);
    }
  };

  if (!orgId) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-900">No Organisation Found</h2>
          <p className="text-sm text-slate-500 mt-1">Please contact support or sign up again.</p>
        </Card>
      </div>
    );
  }

  if (orgLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 flex items-center justify-center gap-2 py-20">
        <Loader2 className="w-5 h-5 animate-spin text-teal-600" />
        <span className="text-slate-500">Loading...</span>
      </div>
    );
  }

  const plan = org?.plan || 'trial';
  const trialEnds = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - Date.now()) / 86400000)) : 0;
  const isOwner = orgRole === 'owner';

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {showWizard && (
        <OwnerWelcomeModal onComplete={() => setShowWizard(false)} />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Building2 className="w-7 h-7 text-teal-600" />
          <h1 className="text-2xl font-bold text-slate-900">Organisation Admin</h1>
        </div>
        <p className="text-sm text-slate-500 ml-10">{org?.name || 'Your Organisation'}</p>
      </div>

      {/* Tabs — 4-column tile grid */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        {TABS.map(t => {
          const Icon = t.icon;
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all touch-manipulation active:scale-95 ${
                isActive
                  ? `bg-gradient-to-br ${t.bg} text-white border-transparent shadow-md`
                  : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : `bg-gradient-to-br ${t.bg}`}`}>
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-white'}`} />
              </div>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── SETUP HUB TAB ────────────────────────────────────────── */}
      {tab === 'setup' && <SetupHub />}

      {/* ── PERMISSIONS TAB ──────────────────────────────────────── */}
      {tab === 'permissions' && <FeaturePermissions />}

      {/* ── IMPORT TAB ───────────────────────────────────────────── */}
      {tab === 'import' && <DataImport />}

      {/* ── LEGAL TAB ────────────────────────────────────────────── */}
      {tab === 'legal' && <LegalPages embedded />}

      {/* ── ARCHIVE TAB ──────────────────────────────────────────── */}
      {tab === 'archive' && <Archive />}

      {/* ── FEEDBACK TAB ─────────────────────────────────────────── */}
      {tab === 'feedback' && <Feedback />}

      {/* ── AWARDS TAB ───────────────────────────────────────────── */}
      {tab === 'awards' && <StaffAwards />}

      {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 text-center">
              <Users className="w-5 h-5 text-blue-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{members.length}</p>
              <p className="text-xs text-slate-500">Team Members</p>
            </Card>
            <Card className="p-4 text-center">
              <MapPin className="w-5 h-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{stats?.areas || areas.length}</p>
              <p className="text-xs text-slate-500">Areas</p>
            </Card>
            <Card className="p-4 text-center">
              <Crown className="w-5 h-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{stats?.clients || 0}</p>
              <p className="text-xs text-slate-500">Service Users</p>
            </Card>
            <Card className="p-4 text-center">
              <Calendar className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-slate-900">{stats?.shiftsThisWeek || 0}</p>
              <p className="text-xs text-slate-500">Shifts This Week</p>
            </Card>
          </div>

          {/* Plan + trial */}
          <Card className="p-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-slate-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[plan]}`}>
                      {PLAN_LABELS[plan] || plan}
                    </span>
                    {plan === 'trial' && trialEnds && (
                      <span className="text-xs text-amber-600">
                        {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {org?.name}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setTab('billing')}>
                Manage Billing <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </Card>

          {/* Invite code */}
          {org?.invite_code && (
            <Card className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <KeyRound className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Staff Invite Code</h3>
                  <p className="text-xs text-slate-500">Share with staff so they can join your team</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-2.5 rounded-lg text-lg font-mono font-bold text-slate-900 tracking-widest text-center">
                  {org.invite_code}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyInvite}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Staff sign up at <strong>carecallai.co.uk/signup</strong> → "Join Existing Team" → enter this code
              </p>
            </Card>
          )}

          {/* Setup wizard button */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-teal-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Setup Wizard</h3>
                  <p className="text-xs text-slate-500">Step-by-step guide to set up your organisation</p>
                </div>
              </div>
              <Button onClick={() => setShowWizard(true)} className="bg-teal-600 hover:bg-teal-700">
                <LayoutGrid className="w-4 h-4 mr-2" /> Open Setup Guide
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── STAFF TAB ────────────────────────────────────────────── */}
      {tab === 'staff' && (
        <div className="space-y-4">
          {/* Invite code */}
          {org?.invite_code && (
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Invite Code: <code className="font-mono font-bold tracking-wider">{org.invite_code}</code>
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={handleCopyInvite}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span className="ml-1">{copied ? 'Copied' : 'Copy'}</span>
                </Button>
              </div>
            </Card>
          )}

          {/* Members list */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Team Members ({members.length})</h3>
              <Link to={createPageUrl('StaffManagement')}>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-1" /> Full Staff HR
                </Button>
              </Link>
            </div>
            {membersLoading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-400" />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map(m => (
                  <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-medium text-slate-600">
                          {(m.profile?.full_name || m.profile?.email || '?')[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {m.profile?.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-400 truncate">{m.profile?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isOwner && m.role !== 'owner' ? (
                        <select
                          value={m.role}
                          onChange={(e) => handleRoleChange(m.id, m.user_id, e.target.value)}
                          className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="member">Staff</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[m.role] || ROLE_COLORS.member}`}>
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      )}
                      {isOwner && m.role !== 'owner' && (
                        <button
                          onClick={() => handleRemoveMember(m.id, m.profile?.full_name || 'this user')}
                          className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                          title="Remove member"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── BILLING TAB ──────────────────────────────────────────── */}
      {tab === 'billing' && (
        <div className="space-y-4">
          {billingLoading ? (
            <Card className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-teal-600 mb-2" />
              <p className="text-sm text-slate-500">Loading billing details from Stripe...</p>
            </Card>
          ) : (
            <>
              {/* Current plan + subscription */}
              <Card className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Crown className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-slate-900">Current Subscription</h3>
                  <Button variant="ghost" size="sm" onClick={() => refetchBilling()} className="ml-auto">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Plan</p>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[plan]}`}>
                      {PLAN_LABELS[plan] || plan}
                    </span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Status</p>
                    <p className="text-sm font-medium text-slate-900">
                      {billing?.subscription?.status === 'trialing' ? 'Trial Active' :
                       billing?.subscription?.status === 'active' ? 'Active' :
                       billing?.subscription?.cancel_at_period_end ? 'Cancelling' :
                       billing?.subscription?.status || 'No subscription'}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Next Billing</p>
                    <p className="text-sm font-medium text-slate-900">
                      {billing?.subscription?.current_period_end
                        ? new Date(billing.subscription.current_period_end).toLocaleDateString('en-GB')
                        : 'N/A'}
                    </p>
                  </div>
                </div>

                {billing?.subscription?.cancel_at_period_end && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <p className="text-sm text-amber-800">
                        Cancels on {new Date(billing.subscription.current_period_end).toLocaleDateString('en-GB')}
                      </p>
                    </div>
                    <Button size="sm" onClick={handleReactivate} className="bg-teal-600 hover:bg-teal-700">
                      Reactivate
                    </Button>
                  </div>
                )}
              </Card>

              {/* Payment method */}
              {billing?.paymentMethod && (
                <Card className="p-5">
                  <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-slate-400" /> Payment Method
                  </h3>
                  <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-4">
                    <div className="w-12 h-8 bg-white border border-slate-200 rounded flex items-center justify-center">
                      <span className="text-xs font-bold text-slate-600">
                        {CARD_BRANDS[billing.paymentMethod.brand] || billing.paymentMethod.brand}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        •••• •••• •••• {billing.paymentMethod.last4}
                      </p>
                      <p className="text-xs text-slate-400">
                        Expires {billing.paymentMethod.exp_month}/{billing.paymentMethod.exp_year}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    To update your card, use the Stripe portal below.
                  </p>
                </Card>
              )}

              {/* Change plan */}
              {isOwner && (
                <Card className="p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-900">
                      {plan === 'trial' || plan === 'cancelled' ? 'Choose a Plan' : 'Change Plan'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${!annual ? 'text-slate-900' : 'text-slate-400'}`}>Monthly</span>
                      <button
                        onClick={() => setAnnual(!annual)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${annual ? 'bg-teal-600' : 'bg-slate-300'}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${annual ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                      <span className={`text-xs font-medium ${annual ? 'text-slate-900' : 'text-slate-400'}`}>
                        Annual <span className="text-teal-600 text-[10px]">Save 20%</span>
                      </span>
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {PLANS.map(p => {
                      const price = annual ? p.price.annual : p.price.monthly;
                      const isCurrent = p.key === plan;
                      return (
                        <div key={p.key} className={`border rounded-lg p-4 ${
                          p.recommended ? 'border-2 border-teal-500' : 'border-slate-200'
                        } ${isCurrent ? 'bg-teal-50' : ''}`}>
                          <div className="flex items-center gap-2">
                            <h5 className="font-medium text-slate-900">{p.name}</h5>
                            {p.recommended && <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Popular</span>}
                            {isCurrent && <span className="text-xs bg-teal-600 text-white px-1.5 py-0.5 rounded font-medium">Current</span>}
                          </div>
                          <p className="text-2xl font-bold text-slate-900 mt-1">
                            £{price}<span className="text-sm font-normal text-slate-500">/mo</span>
                          </p>
                          <p className="text-xs text-slate-500 mt-1">{p.staff}</p>
                          {!isCurrent && (
                            <Button
                              className={`w-full mt-3 ${p.recommended ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                              variant={p.recommended ? 'default' : 'outline'}
                              disabled={!!changingPlan}
                              onClick={() => handleChangePlan(p.key)}
                            >
                              {changingPlan === p.key ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Switch Plan'}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}

              {/* Invoices */}
              {billing?.invoices?.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="p-4 border-b border-slate-100">
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-slate-400" /> Invoices
                    </h3>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {billing.invoices.map(inv => (
                      <div key={inv.id} className="p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-900">
                            {inv.number || inv.id.slice(0, 12)}
                          </p>
                          <p className="text-xs text-slate-400">
                            {new Date(inv.date).toLocaleDateString('en-GB')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="text-sm font-medium text-slate-900">
                            £{inv.amount.toFixed(2)}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                            inv.status === 'open' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {inv.status}
                          </span>
                          {inv.pdf && (
                            <a href={inv.pdf} target="_blank" rel="noopener noreferrer"
                              className="text-teal-600 hover:text-teal-700">
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Cancel / Stripe portal */}
              <div className="flex flex-wrap gap-3">
                {org?.stripe_customer_id && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const result = await invokeFunction('create-portal-session', { organizationId: orgId });
                        if (result.url) window.location.href = result.url;
                      } catch (err) {
                        toast.error(err.message);
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" /> Stripe Portal
                  </Button>
                )}

                {isOwner && billing?.subscription && !billing.subscription.cancel_at_period_end && (
                  <>
                    {!cancelConfirm ? (
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => setCancelConfirm(true)}>
                        Cancel Subscription
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                        <p className="text-sm text-red-800">Are you sure?</p>
                        <Button size="sm" variant="outline" onClick={() => setCancelConfirm(false)}>No</Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={handleCancelSubscription}>
                          Yes, Cancel
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ── SETTINGS TAB ─────────────────────────────────────────── */}
      {tab === 'settings' && (
        <div className="space-y-4">
          {/* Company name */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400" /> Company Name
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="Your company name"
              />
              <Button onClick={handleSaveCompanyName} disabled={savingName || !companyName.trim()}>
                {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
            </div>
          </Card>

          {/* Invite code */}
          {org?.invite_code && (
            <Card className="p-5">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-600" /> Staff Invite Code
              </h3>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-100 px-4 py-2.5 rounded-lg text-lg font-mono font-bold text-slate-900 tracking-widest text-center">
                  {org.invite_code}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyInvite}>
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </Card>
          )}

          {/* Areas */}
          <Card className="p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" /> Areas ({areas.length})
              </h3>
              <Link to={createPageUrl('Settings')}>
                <Button variant="outline" size="sm">Manage in Settings</Button>
              </Link>
            </div>
            {areas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {areas.map(a => (
                  <span key={a.id} className="px-3 py-1.5 bg-green-50 text-green-800 rounded-lg text-sm font-medium">
                    {a.name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No areas created yet. Go to Settings → Rota Settings → Areas.</p>
            )}
          </Card>

          {/* Quick links */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-900 mb-3">Quick Links</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {[
                { label: 'Full Settings', page: 'Settings', icon: Settings },
                { label: 'Staff HR', page: 'StaffManagement', icon: Users },
                { label: 'Rota Management', page: 'RotaManagement', icon: Calendar },
                { label: 'Compliance', page: 'ComplianceManagement', icon: Shield },
              ].map(link => (
                <Link key={link.page} to={createPageUrl(link.page)}
                  className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
                  <link.icon className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{link.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
