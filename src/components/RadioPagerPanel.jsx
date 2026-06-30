import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Radio, PhoneCall, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RadioPagerPanel({ open, onOpenChange, missedCallCount = 0 }) {
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-80 p-0 flex flex-col">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-slate-100">
          <SheetTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center">
              <Radio className="w-3.5 h-3.5 text-green-400" />
            </div>
            Radio
            {missedCallCount > 0 && (
              <span className="ml-auto min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center">
                {missedCallCount}
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {missedCallCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
              <Wifi className="w-10 h-10 opacity-30" />
              <p className="text-xs">No active calls</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <PhoneCall className="w-10 h-10 text-red-500 animate-pulse" />
              <p className="text-sm font-semibold text-red-600">
                {missedCallCount} missed call{missedCallCount !== 1 ? 's' : ''}
              </p>
            </div>
          )}

          <Button
            onClick={() => { onOpenChange(false); navigate(createPageUrl('TwoWayRadio')); }}
            className="w-full bg-slate-900 hover:bg-slate-700 text-green-400 text-sm gap-2"
          >
            <Radio className="w-4 h-4" />
            Open Radio
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
