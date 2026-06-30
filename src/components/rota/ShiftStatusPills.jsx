import React from 'react';

// Shows own and partner check-in / check-out / log-done status on shift cards.
// Only renders pills that are TRUE — never shows "not done" states.
export default function ShiftStatusPills({ shift, shiftCalls = [], partnerShift = null, partnerCalls = [] }) {
  const relevant = shiftCalls.filter(c => c.call_type !== 'sitin_cover');
  const partnerRelevant = partnerCalls.filter(c => c.call_type !== 'sitin_cover');

  const ownIn  = !!shift?.clock_in_time;
  const ownOut = !!shift?.clock_out_time;
  const ownLog = relevant.length > 0 && relevant.every(c => !!c.care_log_id);

  const partnerIn  = !!partnerShift?.clock_in_time;
  const partnerOut = !!partnerShift?.clock_out_time;
  const partnerLog = partnerRelevant.length > 0 && partnerRelevant.every(c => !!c.care_log_id);

  const hasOwn     = ownIn || ownOut || ownLog;
  const hasPartner = partnerShift && (partnerIn || partnerOut || partnerLog);

  if (!hasOwn && !hasPartner) return null;

  const pill = (label) => (
    <span
      key={label}
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-white/25 text-white leading-tight"
    >
      ✓ {label}
    </span>
  );

  const partnerPill = (label) => (
    <span
      key={label}
      className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold bg-black/20 text-white leading-tight"
    >
      Partner ✓ {label}
    </span>
  );

  return (
    <div className="mt-2 space-y-1">
      {hasOwn && (
        <div className="flex flex-wrap gap-1">
          {ownIn  && pill('Checked in')}
          {ownOut && pill('Checked out')}
          {ownLog && pill('Log done')}
        </div>
      )}
      {hasPartner && (
        <div className="flex flex-wrap gap-1">
          {partnerIn  && partnerPill('in')}
          {partnerOut && partnerPill('out')}
          {partnerLog && partnerPill('log')}
        </div>
      )}
    </div>
  );
}
