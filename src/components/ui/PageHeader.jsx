import { cn } from "@/lib/utils";
import { useHelpMode } from '@/lib/HelpModeContext';
import { PAGE_TIPS } from '@/config/helpTips';
import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';

export default function PageHeader({ title, subtitle, children, className, icon: Icon, helpTip }) {
  const { helpMode } = useHelpMode();
  const [tipOpen, setTipOpen] = useState(false);
  const tip = helpTip || PAGE_TIPS[title];

  return (
    <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
      <div>
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8" />}
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          {helpMode && tip && (
            <button
              onClick={() => setTipOpen(!tipOpen)}
              className="p-1 rounded-full hover:bg-teal-100 transition-colors"
              aria-label="Page help"
            >
              <HelpCircle className="w-5 h-5 text-teal-500" />
            </button>
          )}
        </div>
        {subtitle && <p className="text-slate-500 mt-1">{subtitle}</p>}
        {helpMode && tip && tipOpen && (
          <div className="mt-2 bg-slate-800 text-white text-sm rounded-lg shadow-xl p-3 max-w-md relative animate-in fade-in slide-in-from-top-1 duration-200">
            <p className="leading-relaxed pr-6">{tip}</p>
            <button onClick={() => setTipOpen(false)} className="absolute top-2 right-2 opacity-60 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-wrap">
          {children}
        </div>
      )}
    </div>
  );
}
