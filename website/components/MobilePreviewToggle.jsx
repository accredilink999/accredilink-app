'use client';

import { useState, useEffect } from 'react';

export default function MobilePreviewToggle() {
  const [mode, setMode] = useState('desktop'); // 'desktop' | 'mobile' | 'tablet'
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when ?preview=true is in URL
    const params = new URLSearchParams(window.location.search);
    if (process.env.NODE_ENV === 'development' || params.get('preview') === 'true') {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const wrapper = document.getElementById('preview-wrapper');
    if (!wrapper) return;

    if (mode === 'mobile') {
      wrapper.style.maxWidth = '375px';
      wrapper.style.margin = '0 auto';
      wrapper.style.boxShadow = '0 0 0 1px #e2e8f0, 0 25px 50px -12px rgba(0,0,0,0.25)';
      wrapper.style.minHeight = '100vh';
    } else if (mode === 'tablet') {
      wrapper.style.maxWidth = '768px';
      wrapper.style.margin = '0 auto';
      wrapper.style.boxShadow = '0 0 0 1px #e2e8f0, 0 25px 50px -12px rgba(0,0,0,0.25)';
      wrapper.style.minHeight = '100vh';
    } else {
      wrapper.style.maxWidth = '';
      wrapper.style.margin = '';
      wrapper.style.boxShadow = '';
      wrapper.style.minHeight = '';
    }
  }, [mode]);

  if (!visible) return null;

  const modes = [
    { key: 'desktop', label: 'Desktop', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    )},
    { key: 'tablet', label: 'Tablet', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )},
    { key: 'mobile', label: 'Mobile', icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    )},
  ];

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-1 bg-slate-900 text-white rounded-xl p-1 shadow-2xl">
      {modes.map(m => (
        <button
          key={m.key}
          onClick={() => setMode(m.key)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
            mode === m.key
              ? 'bg-welsh-red text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title={m.label}
        >
          {m.icon}
          <span className="hidden sm:inline">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
