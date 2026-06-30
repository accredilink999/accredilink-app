import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronRight } from 'lucide-react';
import TwoWayRadio from '@/pages/TwoWayRadio';

export default function RadioPagerPanel({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] p-0 flex flex-col"
        style={{ overflow: 'visible' }}
      >
        {/* Tab protruding from the left edge — click to slide back right */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute -left-9 top-20 bg-slate-900 text-slate-200 py-5 px-2 rounded-l-xl shadow-xl hover:bg-slate-700 active:bg-slate-800 touch-manipulation z-10 flex flex-col items-center gap-1"
          aria-label="Close radio"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          <ChevronRight className="w-3.5 h-3.5" style={{ transform: 'rotate(180deg)' }} />
          <span className="text-[10px] font-semibold tracking-wider">Radio</span>
        </button>

        {/* Full radio page */}
        <div className="flex-1 overflow-hidden">
          <TwoWayRadio onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
