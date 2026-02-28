import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invokeFunction } from '@/api/functions';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield, Users, Building2, Power, PowerOff, Trash2, ChevronDown, ChevronUp,
  Crown, Loader2, RefreshCw, AlertTriangle, BarChart3, CreditCard, Clock, XCircle,
  Check
} from 'lucide-react';

const PLAN_COLORS = {
  trial: 'bg-yellow-100 text-yellow-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-teal-100 text-teal-800',
  enterprise: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PLAN_LABELS = {
  trial: 'Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  cancelled: 'Cancelled',
};

function callPlatformAdmin(action, params = {}) {
  return invokeFunction('platform-admin', { action, ...params });
}

export default function PlatformAdmin() {
  const queryClient = useQueryClient();
  const [expandedOrg, setExpandedOrg] = useState(null);
  const [confirmKill, setConfirmKill] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Check if current user is platform admin
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  // Fetch all orgs
  const { data: orgsData, isLoading, error, refetch } = useQuery({
    queryKey: ['platform-admin-orgs'],
    queryFn: () => callPlatformAdmin('list-orgs'),
    retry: false,
  });

  // Fetch stats
  const { data: statsData } = useQuery({
    queryKey: ['platform-admin-stats'],
    queryFn: () => callPlatformAdmin('stats'),
    retry: false,
  });

  // Fetch members for expanded org
  const { data: membersData, isLoading: membersLoading } = useQuery({
    queryKey: ['platform-admin-members', expandedOrg],
    queryFn: () => callPlatformAdmin('list-org-members', { organizationId: expandedOrg }),
    enabled: !!expandedOrg,
  });

  // Toggle active mutation
  const toggleMutation = useMutation({
    mutationFn: ({ organizationId, isActive }) =>
      callPlatformAdmin('toggle-org-active', { organizationId, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['platform-admin-stats'] });
      setConfirmKill(null);
    },
  });

  // Update plan mutation
  const planMutation = useMutation({
    mutationFn: ({ organizationId, plan, isActive }) =>
      callPlatformAdmin('update-org-plan', { organizationId, plan, isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['platform-admin-stats'] });
    },
  });

  // Delete org mutation
  const deleteMutation = useMutation({
    mutationFn: ({ organizationId }) =>
      callPlatformAdmin('delete-org', { organizationId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-admin-orgs'] });
      queryClient.invalidateQueries({ queryKey: ['platform-admin-stats'] });
      setConfirmDelete(null);
      setExpandedOrg(null);
    },
  });

  // Access denied
  if (error?.message?.includes('403') || error?.message?.includes('Forbidden')) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-500">This page is only accessible to CareCall AI platform administrators.</p>
        </Card>
      </div>
    );
  }

  const orgs = orgsData?.orgs || [];
  const stats = statsData?.stats || {};

  return (
    <div className="max-w-6xl mx-auto pb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Platform Admin</h1>
            <p className="text-sm text-slate-500">Manage all CareCall AI organisations</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="flex items-center gap-1">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <Card className="p-4 text-center">
          <BarChart3 className="w-5 h-5 text-slate-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-slate-900">{stats.total || 0}</p>
          <p className="text-xs text-slate-500">Total Orgs</p>
        </Card>
        <Card className="p-4 text-center">
          <Check className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-green-600">{stats.active || 0}</p>
          <p className="text-xs text-slate-500">Active</p>
        </Card>
        <Card className="p-4 text-center">
          <Clock className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-yellow-600">{stats.trial || 0}</p>
          <p className="text-xs text-slate-500">On Trial</p>
        </Card>
        <Card className="p-4 text-center">
          <CreditCard className="w-5 h-5 text-teal-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-teal-600">{stats.paid || 0}</p>
          <p className="text-xs text-slate-500">Paid</p>
        </Card>
        <Card className="p-4 text-center">
          <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />
          <p className="text-2xl font-bold text-red-600">{stats.cancelled || 0}</p>
          <p className="text-xs text-slate-500">Cancelled</p>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Loading organisations...</p>
        </Card>
      )}

      {/* Org List */}
      {!isLoading && orgs.length === 0 && (
        <Card className="p-8 text-center">
          <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">No organisations found.</p>
        </Card>
      )}

      <div className="space-y-3">
        {orgs.map((org) => {
          const isExpanded = expandedOrg === org.id;
          const trialEnd = org.trial_ends_at ? new Date(org.trial_ends_at) : null;
          const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - Date.now()) / 86400000)) : null;
          const isActive = org.is_active;

          return (
            <Card key={org.id} className={`overflow-hidden ${!isActive ? 'opacity-70 border-red-200' : ''}`}>
              {/* Org row */}
              <div
                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedOrg(isExpanded ? null : org.id)}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isActive ? 'bg-teal-50' : 'bg-red-50'
                }`}>
                  <Building2 className={`w-5 h-5 ${isActive ? 'text-teal-600' : 'text-red-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-900 truncate">{org.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[org.plan] || PLAN_COLORS.trial}`}>
                      {PLAN_LABELS[org.plan] || org.plan}
                    </span>
                    {!isActive && (
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">INACTIVE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {org.member_count} member{org.member_count !== 1 ? 's' : ''}
                    </span>
                    {trialEnd && org.plan === 'trial' && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Trial: {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
                      </span>
                    )}
                    <span>Created: {new Date(org.created_at).toLocaleDateString('en-GB')}</span>
                  </div>
                </div>

                {/* Quick killswitch */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t bg-slate-50 p-4">
                  <div className="grid sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Organisation Details</h4>
                      <div className="text-xs text-slate-600 space-y-1">
                        <p><span className="font-medium">ID:</span> {org.id}</p>
                        <p><span className="font-medium">Slug:</span> {org.slug}</p>
                        <p><span className="font-medium">Plan:</span> {PLAN_LABELS[org.plan] || org.plan}</p>
                        <p><span className="font-medium">Active:</span> {isActive ? 'Yes' : 'No'}</p>
                        {org.stripe_customer_id && <p><span className="font-medium">Stripe Customer:</span> {org.stripe_customer_id}</p>}
                        {org.stripe_subscription_id && <p><span className="font-medium">Stripe Sub:</span> {org.stripe_subscription_id}</p>}
                        {trialEnd && <p><span className="font-medium">Trial Ends:</span> {trialEnd.toLocaleDateString('en-GB')} {trialEnd.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>}
                        {org.invite_code && <p><span className="font-medium">Invite Code:</span> {org.invite_code}</p>}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-slate-700 mb-2">Members</h4>
                      {membersLoading ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {(membersData?.members || []).map((m) => (
                            <div key={m.id} className="flex items-center gap-2 text-xs bg-white rounded p-2">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                m.role === 'owner' ? 'bg-yellow-100 text-yellow-700' :
                                m.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {(m.profile?.full_name || m.profile?.email || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 truncate">
                                  {m.profile?.full_name || m.profile?.email || 'Unknown'}
                                </p>
                                <p className="text-slate-400 truncate">{m.profile?.email}</p>
                              </div>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                                {m.role}
                              </span>
                            </div>
                          ))}
                          {(membersData?.members || []).length === 0 && (
                            <p className="text-xs text-slate-400">No members found</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-3 border-t">
                    {/* Change plan */}
                    <select
                      className="text-xs border rounded px-2 py-1.5 bg-white"
                      value={org.plan || 'trial'}
                      onChange={(e) => {
                        const newPlan = e.target.value;
                        planMutation.mutate({
                          organizationId: org.id,
                          plan: newPlan,
                          isActive: newPlan !== 'cancelled',
                        });
                      }}
                    >
                      <option value="trial">Trial</option>
                      <option value="starter">Starter</option>
                      <option value="professional">Professional</option>
                      <option value="enterprise">Enterprise</option>
                      <option value="cancelled">Cancelled</option>
                    </select>

                    {/* Killswitch */}
                    {confirmKill === org.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600 font-medium">
                          {isActive ? 'Kill access?' : 'Restore access?'}
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          disabled={toggleMutation.isPending}
                          onClick={() => toggleMutation.mutate({ organizationId: org.id, isActive: !isActive })}
                        >
                          {toggleMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Confirm'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmKill(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant={isActive ? 'destructive' : 'default'}
                        className="h-7 text-xs flex items-center gap-1"
                        onClick={() => setConfirmKill(org.id)}
                      >
                        {isActive ? <PowerOff className="w-3 h-3" /> : <Power className="w-3 h-3" />}
                        {isActive ? 'Kill Access' : 'Restore Access'}
                      </Button>
                    )}

                    {/* Delete org */}
                    {confirmDelete === org.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-600 font-medium">
                          Delete forever?
                        </span>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          disabled={deleteMutation.isPending}
                          onClick={() => deleteMutation.mutate({ organizationId: org.id })}
                        >
                          {deleteMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Delete'}
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setConfirmDelete(null)}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs flex items-center gap-1 text-red-600 hover:text-red-700 border-red-200"
                        onClick={() => setConfirmDelete(org.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete Org
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
