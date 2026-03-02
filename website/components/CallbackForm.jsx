'use client';

import { useState } from 'react';

export default function CallbackForm({ className = '' }) {
  const [formData, setFormData] = useState({ name: '', phone: '', bestTime: 'anytime' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone,
          best_time: formData.bestTime,
          form_type: 'callback',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className={`p-6 bg-green-50 rounded-2xl border border-green-200 text-center ${className}`}>
        <p className="font-semibold text-slate-900">Thank you!</p>
        <p className="text-sm text-slate-600 mt-1">We'll call you back shortly.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`p-6 bg-white rounded-2xl border border-slate-200 shadow-lg ${className}`}>
      <h3 className="font-semibold text-slate-900 mb-1">Request a Callback</h3>
      <p className="text-sm text-slate-500 mb-4">We'll call you back at a time that suits.</p>
      <div className="space-y-3">
        <input
          type="text"
          required
          placeholder="Your name"
          value={formData.name}
          onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
        />
        <input
          type="tel"
          required
          placeholder="Your phone number"
          value={formData.phone}
          onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
        />
        <select
          value={formData.bestTime}
          onChange={e => setFormData(prev => ({ ...prev, bestTime: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#B91C1C]/50 focus:border-[#B91C1C]"
        >
          <option value="anytime">Call me anytime</option>
          <option value="morning">Morning (9am - 12pm)</option>
          <option value="afternoon">Afternoon (12pm - 5pm)</option>
          <option value="evening">Evening (5pm - 7pm)</option>
        </select>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full px-4 py-2.5 bg-[#B91C1C] text-white font-semibold rounded-lg hover:bg-[#DC2626] transition-colors text-sm disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Request Callback'}
        </button>
      </div>
    </form>
  );
}
