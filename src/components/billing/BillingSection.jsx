import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { invokeFunction } from '@/api/functions';
import { useAuth } from '@/lib/AuthContext';
import { getCurrentOrgId } from '@/lib/orgContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Building2, Crown, Loader2, ExternalLink, Calendar, Users, Copy, Check, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

const PLAN_LABELS = {
  trial: 'Free Trial',
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  cancelled: 'Cancelled',
};

const PLAN_COLORS = {
  trial: 'bg-yellow-100 text-yellow-800',
  starter: 'bg-blue-100 text-blue-800',
  professional: 'bg-teal-100 text-teal-800',
  enterprise: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

const PLANS = [
  {
    key: 'starter',
    name: 'CareCall AI',
    price: { monthly: 99, annual: 99 },
    staff: 'Unlimited staff',
    features: 'Everything included — scheduling, GPS, eMAR, radio, alerter, compliance, reports and every new feature we build',
    recommended: true,
  },
];

export default function BillingSection() {
  const { user } = useAuth();
  const orgId = getCurrentOrgId();
  const [upgrading, setUpgrading] = useState(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [annual, setAnnual] = useState(false);

  const { data: org, isLoading } = useQuery({
    queryKey: ['billing-org', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!orgId,
  });

  const { data: memberCount } = useQuery({
    queryKey: ['org-member-count', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await supabase
        .from('organization_members')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const handleUpgrade = async (plan) => {
    setUpgrading(plan);
    try {
      const result = await invokeFunction('create-checkout-session', {
        plan,
        organizationId: orgId,
        billing: annual ? 'annual' : 'monthly',
      });

      if (result.url) {
        window.location.href = result.url;
      } else if (result.message) {
        toast.info(result.message);
      } else {
        toast.error(result.error || 'Failed to create checkout session');
      }
    } catch (err) {
      toast.error('Failed to start checkout: ' + (err.message || 'Unknown error'));
    } finally {
      setUpgrading(null);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const result = await invokeFunction('create-portal-session', {
        organizationId: orgId,
      });

      if (result.url) {
        window.location.href = result.url;
      } else {
        toast.error(result.error || 'Failed to open billing portal');
      }
    } catch (err) {
      toast.error('Failed to open portal: ' + (err.message || 'Unknown error'));
    } finally {
      setPortalLoading(false);
    }
  };

  if (!orgId) {
    return (
      <Card className="p-6">
        <p className="text-sm text-slate-500">No organisation found. Please set up your organisation first.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-slate-500">Loading billing info...</span>
      </Card>
    );
  }

  const plan = org?.plan || 'trial';
  const trialEnds = org?.trial_ends_at ? new Date(org.trial_ends_at) : null;
  const trialDaysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - Date.now()) / 86400000)) : 0;
  const isTrial = plan === 'trial';
  const showUpgrade = isTrial || plan === 'cancelled';
  const canUpgradeTo = (planKey) => {
    const order = { trial: 0, cancelled: 0, starter: 1, professional: 2, enterprise: 3 };
    return (order[planKey] || 0) > (order[plan] || 0);
  };

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
            <Crown className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Subscription & Billing</h3>
            <p className="text-sm text-slate-500">Manage your plan and payment</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Organisation</span>
            </div>
            <p className="font-medium text-slate-900">{org?.name || 'Unknown'}</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <CreditCard className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Current Plan</span>
            </div>
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${PLAN_COLORS[plan] || PLAN_COLORS.trial}`}>
              {PLAN_LABELS[plan] || plan}
            </span>
          </div>

          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-1">
              <Users className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-500">Team Members</span>
            </div>
            <p className="font-medium text-slate-900">{memberCount || 0}</p>
          </div>
        </div>

        {isTrial && trialEnds && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-start gap-2">
            <Calendar className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Free trial — {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} remaining
              </p>
              <p className="text-xs text-yellow-600 mt-0.5">
                Trial ends {trialEnds.toLocaleDateString('en-GB')}. Choose a plan before then to keep using CareCallAI.
              </p>
            </div>
          </div>
        )}

        {plan === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm font-medium text-red-800">Your subscription has been cancelled.</p>
            <p className="text-xs text-red-600 mt-0.5">Resubscribe below to regain access to all features.</p>
          </div>
        )}
      </Card>

      {/* Staff invite code */}
      {org?.invite_code && (
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Staff Invite Code</h3>
              <p className="text-sm text-slate-500">Share this code with staff so they can join your organisation</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-slate-100 px-4 py-2.5 rounded-lg text-lg font-mono font-bold text-slate-900 tracking-widest text-center">
              {org.invite_code}
            </code>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => {
                navigator.clipboard.writeText(org.invite_code);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Staff enter this code when they sign up at the app. They'll automatically join your team as a member.
          </p>
        </Card>
      )}

      {/* Upgrade / Choose plan */}
      {(showUpgrade || canUpgradeTo('enterprise')) && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-slate-900">
              {showUpgrade ? 'Choose a Plan' : 'Upgrade Your Plan'}
            </h4>
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
            {PLANS.filter(p => showUpgrade || canUpgradeTo(p.key)).map((p) => {
              const price = annual ? p.price.annual : p.price.monthly;
              return (
              <div
                key={p.key}
                className={`border rounded-lg p-4 ${
                  p.recommended
                    ? 'border-2 border-teal-500'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <h5 className="font-medium text-slate-900">{p.name}</h5>
                  {p.recommended && (
                    <span className="text-xs bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-medium">Popular</span>
                  )}
                </div>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  £{price}<span className="text-sm font-normal text-slate-500">/mo</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">{p.staff}</p>
                <p className="text-xs text-slate-400 mt-1">{p.features}</p>
                <Button
                  className={`w-full mt-3 ${p.recommended ? 'bg-teal-600 hover:bg-teal-700' : ''}`}
                  variant={p.recommended ? 'default' : 'outline'}
                  disabled={!!upgrading}
                  onClick={() => handleUpgrade(p.key)}
                >
                  {upgrading === p.key ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : showUpgrade ? 'Start 30-Day Trial' : 'Upgrade'}
                </Button>
              </div>
            );
          })}
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            30-day free trial. No credit card required. Cancel anytime.
          </p>
        </Card>
      )}

      {/* Manage subscription (for paid/trialing plans with Stripe) */}
      {org?.stripe_subscription_id && (
        <Card className="p-6">
          <h4 className="font-semibold text-slate-900 mb-2">Manage Subscription</h4>
          <p className="text-sm text-slate-500 mb-3">
            Update payment method, view invoices, or cancel your subscription through the Stripe portal.
          </p>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            disabled={portalLoading}
            onClick={handleManageSubscription}
          >
            {portalLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Manage on Stripe
          </Button>
        </Card>
      )}
    </div>
  );
}
