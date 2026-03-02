import { checkOrgAccess, getCurrentOrg, getCurrentOrgRole } from '@/lib/orgContext';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CreditCard, Clock, Sparkles } from 'lucide-react';
import PlanSelector from './PlanSelector';

export default function SubscriptionGate() {
  const navigate = useNavigate();
  const access = checkOrgAccess();
  const org = getCurrentOrg();
  const role = getCurrentOrgRole();

  if (access.active) return null;

  const isNewUser = access.reason === 'no_subscription';
  const isExpiredTrial = access.reason === 'trial_expired';

  // New user who hasn't picked a plan yet — show full-screen plan selector
  if (isNewUser && role === 'owner') {
    return (
      <div className="fixed inset-0 z-[99999] bg-gradient-to-b from-slate-50 to-white overflow-auto">
        <PlanSelector />
      </div>
    );
  }

  // Staff member whose org owner hasn't set up billing
  if (isNewUser && role !== 'owner') {
    return (
      <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 bg-amber-100">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Setup in Progress</h2>
          <p className="text-slate-600 mb-6">
            Your organisation&apos;s owner needs to select a plan before you can access the app. Please contact your manager.
          </p>
          {org?.name && (
            <p className="text-sm text-slate-500">
              Organisation: <span className="font-medium">{org.name}</span>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[99999] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 ${
          isExpiredTrial ? 'bg-amber-100' : 'bg-red-100'
        }`}>
          {isExpiredTrial ? (
            <Clock className="w-8 h-8 text-amber-600" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-red-600" />
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {isExpiredTrial ? 'Your Trial Has Ended' : 'Subscription Inactive'}
        </h2>

        <p className="text-slate-600 mb-6">
          {isExpiredTrial
            ? 'Your 7-day free trial has expired. Subscribe to continue using CareCall AI with all features.'
            : 'Your subscription has been cancelled or payment failed. Reactivate to regain access.'
          }
        </p>

        {org?.name && (
          <p className="text-sm text-slate-500 mb-6">
            Organisation: <span className="font-medium">{org.name}</span>
          </p>
        )}

        <button
          onClick={() => navigate('/Settings', { state: { openBilling: true } })}
          className="w-full py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <CreditCard className="w-5 h-5" />
          {isExpiredTrial ? 'Subscribe Now' : 'Reactivate Subscription'}
        </button>

        <a
          href="https://carecallai.co.uk/pricing"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-teal-600 hover:text-teal-700 underline"
        >
          View pricing plans
        </a>
      </div>
    </div>
  );
}
