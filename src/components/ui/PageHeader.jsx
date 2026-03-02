import { cn } from "@/lib/utils";
import { useHelpMode } from '@/lib/HelpModeContext';
import { PAGE_TIPS } from '@/config/helpTips';
import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function PageHeader({ title, subtitle, children, className, icon: Icon, helpTip }) {
  const { helpMode } = useHelpMode();
  const [dismissed, setDismissed] = useState(false);
  const tip = helpTip || PAGE_TIPS[title];

  return (
    <div className={cn("flex flex-col gap-2 mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8" />}
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
        {children && (
          <div className="flex items-center gap-3 flex-wrap">
            {children}
          </div>
        )}
      </div>
      {subtitle && <p className="text-slate-500">{subtitle}</p>}
      {/* Auto-show help banner when help mode is ON */}
      {helpMode && tip && !dismissed && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-3 flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-300">
          <HelpCircle className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-teal-800 leading-relaxed">{tip}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="opacity-50 hover:opacity-100 flex-shrink-0"
          >
            <X className="w-4 h-4 text-teal-600" />
          </button>
        </div>
      )}
      {helpMode && tip && dismissed && (
        <button
          onClick={() => setDismissed(false)}
          className="self-start p-1 rounded-full bg-teal-100 hover:bg-teal-200 transition-colors"
          title="Show page help"
        >
          <HelpCircle className="w-4 h-4 text-teal-500" />
        </button>
      )}
    </div>
  );
}
