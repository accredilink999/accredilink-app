import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { HelpCircle, ChevronRight } from 'lucide-react';

function StepCard({ number, icon: Icon, iconColor = 'bg-teal-500', title, children, tip, warning }) {
  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className={`w-9 h-9 rounded-xl ${iconColor} flex items-center justify-center shadow-sm`}>
          {Icon ? <Icon className="w-4 h-4 text-white" strokeWidth={2} /> : (
            <span className="text-white font-bold text-sm">{number}</span>
          )}
        </div>
        <div className="w-px flex-1 bg-slate-200 mt-2" />
      </div>
      <div className="flex-1 pb-2">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Step {number}</span>
        </div>
        <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{title}</h3>
        <div className="text-sm text-slate-600 leading-relaxed space-y-1">{children}</div>
        {tip && (
          <div className="mt-2 bg-teal-50 border border-teal-200 rounded-lg p-2.5 text-xs text-teal-800 leading-relaxed">
            <span className="font-semibold">Tip: </span>{tip}
          </div>
        )}
        {warning && (
          <div className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-800 leading-relaxed">
            <span className="font-semibold">Note: </span>{warning}
          </div>
        )}
      </div>
    </div>
  );
}

export { StepCard };

export default function TutorialModal({ open, onClose, title, adminContent, staffContent, defaultTab = 'admin', staffOnly = false }) {
  const [tab, setTab] = useState(defaultTab);

  const showAdminTab = !staffOnly && !!adminContent;
  const showStaffTab = !!staffContent;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <HelpCircle className="w-4 h-4 text-blue-600" />
            </div>
            <DialogTitle className="text-base font-semibold">{title || 'How To Use'}</DialogTitle>
          </div>
        </DialogHeader>

        {showAdminTab && showStaffTab ? (
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
            <TabsList className="mx-5 mt-3 mb-0 flex-shrink-0">
              <TabsTrigger value="admin" className="flex-1 text-xs">Admin Guide</TabsTrigger>
              <TabsTrigger value="staff" className="flex-1 text-xs">Staff Guide</TabsTrigger>
            </TabsList>
            <TabsContent value="admin" className="flex-1 overflow-y-auto px-5 pt-4 pb-5 mt-0">
              {adminContent}
            </TabsContent>
            <TabsContent value="staff" className="flex-1 overflow-y-auto px-5 pt-4 pb-5 mt-0">
              {staffContent}
            </TabsContent>
          </Tabs>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pt-4 pb-5">
            {showAdminTab ? adminContent : staffContent}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
