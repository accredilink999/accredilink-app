/**
 * TermsConsentGate
 *
 * Full-screen consent gate shown to authenticated users who have not yet
 * accepted the Terms of Service, Privacy Policy, and IP Statement.
 *
 * Required by:
 * - Apple App Store Guideline 5.1.1 (Data Collection and Storage)
 * - Apple App Store Guideline 5.1.2 (Data Use and Sharing)
 * - Google Play Developer Policy (User Data)
 * - UK GDPR Article 7 (Conditions for Consent)
 *
 * Records `terms_accepted_at` timestamp in profiles for audit trail.
 */

import { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Shield, FileText, Scale, Check, LogOut, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function TermsConsentGate({ onAccepted }) {
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedIP, setAgreedIP] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null); // 'terms' | 'privacy' | 'ip' | null
  const isDark = document.documentElement.classList.contains('dark');

  const allAgreed = agreedTerms && agreedPrivacy && agreedIP;

  const handleAccept = async () => {
    if (!allAgreed) return;
    setSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const now = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          terms_accepted_at: now,
          terms_version: '2026-03',
        })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      onAccepted?.();
    } catch (err) {
      setError(err.message || 'Failed to save consent. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const toggleExpand = (section) => {
    setExpanded(expanded === section ? null : section);
  };

  const checkboxStyle = (checked) => ({
    width: 22,
    height: 22,
    borderRadius: 6,
    border: `2px solid ${checked ? '#0d9488' : isDark ? '#475569' : '#cbd5e1'}`,
    background: checked ? '#0d9488' : 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.2s',
  });

  const consentItems = [
    {
      key: 'terms',
      checked: agreedTerms,
      toggle: () => setAgreedTerms(!agreedTerms),
      icon: FileText,
      title: 'Terms of Service',
      summary: 'I have read and agree to the CareCallAI Terms of Service, including subscription terms, acceptable use policy, and limitation of liability.',
      content: (
        <div className="text-xs space-y-2 mt-2">
          <p>Key points:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>CareCallAI is a care management platform for domiciliary care and care homes</li>
            <li>14-day free trial, then subscription-based access via Stripe</li>
            <li>You retain full ownership of all your data</li>
            <li>You may export your data at any time</li>
            <li>Either party may terminate with 30 days' notice</li>
            <li>Governed by the laws of England and Wales</li>
          </ul>
        </div>
      ),
    },
    {
      key: 'privacy',
      checked: agreedPrivacy,
      toggle: () => setAgreedPrivacy(!agreedPrivacy),
      icon: Shield,
      title: 'Privacy Policy',
      summary: 'I consent to the collection and processing of my data as described in the Privacy Policy, including location data for visit verification and push notifications.',
      content: (
        <div className="text-xs space-y-2 mt-2">
          <p>Key points:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>We collect account info, care records, device info, and location data</li>
            <li>Location is used for clock-in verification (with your consent)</li>
            <li>Biometric data stays on your device — never sent to our servers</li>
            <li>Data stored in the EEA with encryption at rest and in transit</li>
            <li>You have GDPR rights: access, rectify, erase, restrict, port, object</li>
            <li>We will notify ICO within 72 hours of any data breach</li>
            <li>We do not sell your personal data</li>
          </ul>
        </div>
      ),
    },
    {
      key: 'ip',
      checked: agreedIP,
      toggle: () => setAgreedIP(!agreedIP),
      icon: Scale,
      title: 'Intellectual Property',
      summary: 'I acknowledge that the CareCallAI platform, software, and branding are the intellectual property of CareCallAI, and I will not copy, reverse engineer, or redistribute the Service.',
      content: (
        <div className="text-xs space-y-2 mt-2">
          <p>Key points:</p>
          <ul className="list-disc pl-4 space-y-1">
            <li>CareCallAI platform and branding are proprietary</li>
            <li>You retain ownership of all your data and content</li>
            <li>Limited licence to use the Service for your business</li>
            <li>No reverse engineering, copying, or redistribution</li>
            <li>AI-generated content is yours to use</li>
            <li>Feedback may be used to improve the Service</li>
          </ul>
        </div>
      ),
    },
  ];

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${isDark ? 'bg-slate-900' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-600 text-white mb-3">
            <Shield className="w-7 h-7" />
          </div>
          <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Review & Accept
          </h1>
          <p className={`mt-1.5 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Please review and accept the following to continue using CareCallAI.
          </p>
        </div>

        {/* Consent items */}
        <div className={`rounded-xl border shadow-sm ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          {consentItems.map((item, i) => {
            const Icon = item.icon;
            const isExpanded = expanded === item.key;
            return (
              <div
                key={item.key}
                className={`p-4 ${i > 0 ? `border-t ${isDark ? 'border-slate-700' : 'border-slate-100'}` : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <button
                    onClick={item.toggle}
                    style={checkboxStyle(item.checked)}
                    aria-label={`Accept ${item.title}`}
                    aria-checked={item.checked}
                    role="checkbox"
                  >
                    {item.checked && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`w-4 h-4 ${isDark ? 'text-teal-400' : 'text-teal-600'}`} />
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {item.title}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {item.summary}
                    </p>

                    {/* Expand/collapse */}
                    <button
                      onClick={() => toggleExpand(item.key)}
                      className={`flex items-center gap-1 mt-2 text-xs font-medium ${isDark ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'}`}
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="w-3 h-3" />
                          Hide key points
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3" />
                          View key points
                        </>
                      )}
                    </button>

                    {isExpanded && (
                      <div className={`${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {item.content}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg ${isDark ? 'text-red-400 bg-red-900/30' : 'text-red-600 bg-red-50'}`}>
            {error}
          </div>
        )}

        {/* Accept button */}
        <button
          onClick={handleAccept}
          disabled={!allAgreed || saving}
          className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-white transition-all ${
            allAgreed
              ? 'bg-teal-600 hover:bg-teal-700 active:scale-[0.98]'
              : isDark
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Check className="w-4 h-4" />
              I Agree — Continue
            </>
          )}
        </button>

        <p className={`text-xs text-center mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          You can review these documents anytime in Settings &gt; Legal.
        </p>

        {/* Full documents link */}
        <p className={`text-xs text-center mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
          Full documents:{' '}
          <a href="https://carecallai.co.uk/terms" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Terms</a>
          {' · '}
          <a href="https://carecallai.co.uk/privacy" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">Privacy</a>
        </p>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 text-sm mt-4 pt-3 ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
