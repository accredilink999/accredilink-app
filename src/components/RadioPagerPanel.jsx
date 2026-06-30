import { Sheet, SheetContent } from '@/components/ui/sheet';
import TwoWayRadio from '@/pages/TwoWayRadio';

export default function RadioPagerPanel({ open, onOpenChange, missedCallCount = 0 }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="p-0 h-[96vh] flex flex-col rounded-t-2xl overflow-hidden"
      >
        {/* Drag bar — click to close */}
        <div
          onClick={() => onOpenChange(false)}
          className="flex justify-center pt-3 pb-1 shrink-0 cursor-pointer touch-manipulation"
          aria-label="Close radio"
        >
          <div className="w-12 h-1.5 rounded-full bg-slate-400 opacity-60" />
        </div>

        {/* Full radio page — scrolls internally */}
        <div className="flex-1 overflow-hidden">
          <TwoWayRadio onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
