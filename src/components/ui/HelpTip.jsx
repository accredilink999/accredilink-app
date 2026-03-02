import { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { useHelpMode } from '@/lib/HelpModeContext';

/**
 * HelpTip — contextual help shown when help mode is ON.
 * Tips auto-display as visible banners when help is active.
 * Users can dismiss individual tips, but they reappear next session.
 *
 * Usage:
 *   <HelpTip tip="Explains what this section does">
 *     <h3>Section Title</h3>
 *   </HelpTip>
 *
 * Or inline:
 *   <HelpTip tip="Explanation text" inline />
 */
export default function HelpTip({ children, tip, inline = false }) {
  const { helpMode } = useHelpMode();
  const [dismissed, setDismissed] = useState(false);

  if (!helpMode) return children || null;

  // Inline mode: show a compact colored badge next to text
  if (inline) {
    return (
      <span className="relative inline-flex items-center">
        {!dismissed && (
          <span className="ml-1.5 inline-flex items-center gap-1 bg-teal-50 border border-teal-200 text-teal-700 text-[11px] rounded-md px-1.5 py-0.5 animate-in fade-in duration-300">
            <HelpCircle className="w-3 h-3 text-teal-500 flex-shrink-0" />
            <span className="max-w-[200px] leading-tight">{tip}</span>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); }}
              className="ml-0.5 opacity-50 hover:opacity-100 flex-shrink-0"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          </span>
        )}
        {dismissed && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(false); }}
            className="ml-1 p-0.5 rounded-full bg-teal-100 hover:bg-teal-200 transition-colors"
            title="Show help tip"
          >
            <HelpCircle className="w-3 h-3 text-teal-500" />
          </button>
        )}
      </span>
    );
  }

  // Block mode: show a visible help banner below the wrapped content
  return (
    <div className="relative">
      {children}
      {!dismissed && (
        <div className="mt-1.5 bg-teal-50 border border-teal-200 rounded-lg p-2.5 flex items-start gap-2 animate-in fade-in slide-in-from-top-1 duration-300">
          <HelpCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-teal-800 leading-relaxed flex-1">{tip}</p>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDismissed(true); }}
            className="opacity-50 hover:opacity-100 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5 text-teal-600" />
          </button>
        </div>
      )}
      {dismissed && (
        <button
          onClick={() => setDismissed(false)}
          className="mt-1 p-1 rounded-full bg-teal-100 hover:bg-teal-200 transition-colors"
          title="Show help tip"
        >
          <HelpCircle className="w-4 h-4 text-teal-500" />
        </button>
      )}
    </div>
  );
}
