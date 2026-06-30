import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronDown } from 'lucide-react';
import TwoWayRadio from '@/pages/TwoWayRadio';

export default function RadioPagerPanel({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 h-[96vh] flex flex-col rounded-t-2xl"
        style={{ overflow: 'visible' }}
      >
        {/* Tab protruding above the sheet — click to slide back down */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute left-1/2 -translate-x-1/2 -top-9 bg-slate-800 text-slate-200 px-8 py-2 rounded-t-xl text-xs font-semibold flex items-center gap-1.5 shadow-xl hover:bg-slate-700 active:bg-slate-900 touch-manipulation z-10"
          aria-label="Close radio"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          Radio
        </button>

        {/* Full radio page */}
        <div className="flex-1 overflow-hidden rounded-t-2xl">
          <TwoWayRadio onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
