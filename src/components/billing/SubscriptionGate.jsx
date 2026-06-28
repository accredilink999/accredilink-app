import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Clock, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { initOrg, checkOrgAccess, getCurrentOrg, getCurrentOrgRole } from '@/lib/orgContext';

export default function SubscriptionGate() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [access, setAccess] = useState({ active: true });
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    // initOrg() caches — resolves instantly if already loaded by App.jsx
    initOrg().then(() => {
      setAccess(checkOrgAccess());
      setChecked(true);
    });
  }, [isAuthenticated, user?.id]);

  // Also allow Settings through so users can reach billing
  const isSettingsPage = typeof window !== 'undefined' && window.location.pathname.toLowerCase().includes('settings');

  if (!checked || access.active || isSettingsPage) return null;

  const org = getCurrentOrg();
  const role = getCurrentOrgRole();
  const isExpiredTrial = access.reason === 'trial_expired';

  return (
    <div className="fixed inset-0 z-[99999] overflow-auto" style={{ background: 'linear-gradient(160deg,#0f172a 0%,#1e293b 60%,#0c2a1e 100%)' }}>
      <div className="min-h-full flex flex-col items-center justify-center p-4 py-12">
        <img src="/logo.png" alt="CareCall AI" className="h-14 mb-6 object-contain" onError={e => e.target.style.display='none'} />

        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${isExpiredTrial ? 'bg-amber-100' : 'bg-red-100'}`}>
            {isExpiredTrial ? <Clock className="w-8 h-8 text-amber-600" /> : <AlertTriangle className="w-8 h-8 text-red-600" />}
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            {isExpiredTrial ? 'Your Free Trial Has Ended' : 'Subscription Inactive'}
          </h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">
            {isExpiredTrial
              ? 'Your trial period has ended. Subscribe to continue — everything included, unlimited staff, one flat price.'
              : 'Your subscription is inactive or payment failed. Reactivate to regain full access.'
            }
          </p>

          {org?.name && (
            <p className="text-xs text-slate-400 mb-5">Organisation: <span className="font-semibold text-slate-600">{org.name}</span></p>
          )}

          <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-5">
            <div className="text-3xl font-extrabold text-teal-700 mb-1">£99<span className="text-base font-medium text-teal-500">/month</span></div>
            <div className="text-sm text-teal-700 font-medium mb-2">Everything included · Unlimited staff</div>
            <div className="text-xs text-slate-500">Scheduling · GPS · eMAR · Radio · Alerter · Compliance · Reports<br />Price guaranteed never to increase for existing subscribers</div>
          </div>

          <button
            onClick={() => navigate('/Settings', { state: { openBilling: true } })}
            className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 mb-3"
          >
            <CreditCard className="w-5 h-5" />
            Subscribe for £99/month
          </button>

          <a
            href="/demo"
            className="w-full py-2.5 border border-slate-200 text-slate-600 font-medium rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 text-sm mb-4"
          >
            <Sparkles className="w-4 h-4" />
            Watch the full demo first
          </a>

          <p className="text-xs text-slate-400">
            Questions? Email <a href="mailto:hello@carecallai.co.uk" className="text-teal-600 underline">hello@carecallai.co.uk</a>
          </p>
        </div>
      </div>
    </div>
  );
}
