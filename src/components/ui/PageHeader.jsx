import { cn } from "@/lib/utils";
import { useHelpMode } from '@/lib/HelpModeContext';
import { PAGE_TIPS } from '@/config/helpTips';
import { HelpCircle, X } from 'lucide-react';
import { useState } from 'react';
import TutorialModal from '@/components/TutorialModal';
import { PAGE_TUTORIALS } from '@/config/pageTutorials';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function PageHeader({ title, subtitle, children, className, icon: Icon, helpTip, tutorialKey }) {
  const { helpMode } = useHelpMode();
  const [dismissed, setDismissed] = useState(false);
  const [tutorialOpen, setTutorialOpen] = useState(false);
  const tip = helpTip || PAGE_TIPS[title];
  const tutorial = tutorialKey ? PAGE_TUTORIALS[tutorialKey] : null;

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    enabled: !!tutorial,
    staleTime: 300000,
  });
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin' ||
    ['admin', 'manager', 'supervisor'].includes(currentUser?.job_title);
  const defaultTab = isAdmin ? 'admin' : 'staff';

  return (
    <div className={cn("flex flex-col gap-2 mb-6", className)}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8" />}
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {tutorial && (
            <button
              onClick={() => setTutorialOpen(true)}
              className="h-9 px-3 flex items-center gap-1.5 rounded-lg border-2 border-blue-200 text-blue-700 hover:bg-blue-50 text-sm font-medium transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How To</span>
            </button>
          )}
          {children}
        </div>
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
      {tutorial && (
        <TutorialModal
          open={tutorialOpen}
          onClose={() => setTutorialOpen(false)}
          title={tutorial.title}
          adminContent={tutorial.adminContent}
          staffContent={tutorial.staffContent}
          staffOnly={tutorial.staffOnly || (!tutorial.adminContent)}
          defaultTab={tutorial.staffOnly || !tutorial.adminContent ? 'staff' : defaultTab}
        />
      )}
    </div>
  );
}
