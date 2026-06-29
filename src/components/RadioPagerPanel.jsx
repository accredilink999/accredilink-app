import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Radio, Bell, PhoneCall, ExternalLink, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RadioPagerPanel({ open, onOpenChange, missedCallCount = 0, pagerCount = 0 }) {
  const navigate = useNavigate();

  const go = (page) => {
    onOpenChange(false);
    navigate(createPageUrl(page));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-80 p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
          <SheetTitle className="text-base font-bold text-slate-800">Comms</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">

          {/* ── Radio ── */}
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
                <Radio className="w-3.5 h-3.5 text-green-400" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Radio</span>
              {missedCallCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {missedCallCount}
                </span>
              )}
            </div>

            {missedCallCount === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
                <Wifi className="w-8 h-8 opacity-30" />
                <p className="text-xs">No active calls</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <PhoneCall className="w-8 h-8 text-red-500 animate-pulse" />
                <p className="text-sm font-semibold text-red-600">{missedCallCount} missed call{missedCallCount !== 1 ? 's' : ''}</p>
              </div>
            )}

            <Button
              onClick={() => go('TwoWayRadio')}
              className="w-full bg-slate-900 hover:bg-slate-700 text-green-400 text-sm gap-2"
            >
              <Radio className="w-4 h-4" />
              Open Radio
            </Button>
          </div>

          {/* ── Pager ── */}
          <div className="px-5 py-5 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-800">Pager</span>
              {pagerCount > 0 && (
                <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                  {pagerCount}
                </span>
              )}
            </div>

            <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-400">
              <Bell className="w-8 h-8 opacity-30" />
              <p className="text-xs">No messages</p>
            </div>

            <Button
              variant="outline"
              className="w-full text-sm gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
              disabled
            >
              <ExternalLink className="w-4 h-4" />
              Pager coming soon
            </Button>
          </div>

        </div>
      </SheetContent>
    </Sheet>
  );
}
