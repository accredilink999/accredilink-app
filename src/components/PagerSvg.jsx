import React from 'react';

// SVG replica of the pager icon — no external image file required.
// Viewport is 440x340. All button hit-areas are annotated with data-button.
export default function PagerSvg({ className = '', style = {} }) {
  return (
    <svg
      viewBox="0 0 440 340"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-label="Pager device"
    >
      {/* ── Body ── */}
      <rect x="30" y="20" width="380" height="300" rx="30" ry="30" fill="#2b2b2b" />

      {/* ── LCD bezel ── */}
      <rect x="50" y="38" width="340" height="190" rx="8" ry="8" fill="#1a1a1a" />

      {/* ── LCD screen ── */}
      <rect x="56" y="44" width="328" height="178" rx="5" ry="5" fill="#b8c4a8" />

      {/* subtle LCD inner reflection */}
      <rect x="56" y="44" width="328" height="30" rx="5" ry="5" fill="rgba(255,255,255,0.07)" />

      {/* ── Button row ── */}
      {/* Green button */}
      <rect x="60" y="248" width="52" height="36" rx="7" fill="#1a6b2a" />
      <rect x="60" y="248" width="52" height="18" rx="7" fill="#22a83a" />

      {/* Red button */}
      <rect x="124" y="248" width="52" height="36" rx="7" fill="#8b1a1a" />
      <rect x="124" y="248" width="52" height="18" rx="7" fill="#d93232" />

      {/* ── D-pad ── */}
      {/* Centre circle */}
      <circle cx="316" cy="266" r="42" fill="#1a1a1a" />
      <circle cx="316" cy="266" r="36" fill="#3a3a3a" />

      {/* Left arrow */}
      <polygon points="280,266 295,255 295,277" fill="#e0e0e0" />
      {/* Right arrow */}
      <polygon points="352,266 337,255 337,277" fill="#e0e0e0" />
      {/* Up arrow */}
      <polygon points="316,230 305,245 327,245" fill="#e0e0e0" />
      {/* Down arrow */}
      <polygon points="316,302 305,287 327,287" fill="#e0e0e0" />

      {/* Centre dot */}
      <circle cx="316" cy="266" r="10" fill="#555" />

      {/* Keypad row — small squares for realism */}
      <rect x="60" y="295" width="52" height="10" rx="3" fill="#3a3a3a" />
      <rect x="124" y="295" width="52" height="10" rx="3" fill="#3a3a3a" />
      <rect x="188" y="295" width="52" height="10" rx="3" fill="#3a3a3a" />
    </svg>
  );
}
