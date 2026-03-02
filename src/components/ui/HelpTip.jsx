import { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useHelpMode } from '@/lib/HelpModeContext';

/**
 * HelpTip — contextual help tooltip shown when help mode is ON.
 *
 * Usage:
 *   <HelpTip tip="Explains what this section does">
 *     <h3>Section Title</h3>
 *   </HelpTip>
 *
 * Or inline without wrapping:
 *   <HelpTip tip="Explanation text" inline />
 */
export default function HelpTip({ children, tip, inline = false }) {
  const { helpMode } = useHelpMode();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [open]);

  if (!helpMode) return children || null;

  if (inline) {
    return (
      <span className="relative inline-flex items-center" ref={ref}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
          className="ml-1 p-0.5 rounded-full hover:bg-teal-100 transition-colors inline-flex"
          aria-label="Help"
        >
          <HelpCircle className="w-3.5 h-3.5 text-teal-500" />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-[9999] w-64">
            <div className="bg-slate-800 text-white text-xs rounded-lg shadow-xl p-3 relative">
              <div className="absolute -top-1.5 left-3 w-3 h-3 bg-slate-800 rotate-45" />
              <p className="leading-relaxed">{tip}</p>
              <button onClick={() => setOpen(false)} className="absolute top-1.5 right-1.5 opacity-50 hover:opacity-100">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </span>
    );
  }

  return (
    <div className="relative inline-flex items-center gap-1" ref={ref}>
      {children}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(!open); }}
        className="p-0.5 rounded-full hover:bg-teal-100 transition-colors flex-shrink-0"
        aria-label="Help"
      >
        <HelpCircle className="w-4 h-4 text-teal-500" />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1 z-[9999] w-72">
          <div className="bg-slate-800 text-white text-xs rounded-lg shadow-xl p-3 relative">
            <div className="absolute -top-1.5 left-4 w-3 h-3 bg-slate-800 rotate-45" />
            <p className="leading-relaxed">{tip}</p>
            <button onClick={() => setOpen(false)} className="absolute top-1.5 right-1.5 opacity-50 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
