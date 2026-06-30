import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X } from 'lucide-react';
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
          className="absolute -left-9 top-20 bg-red-600 text-white py-4 px-2 rounded-l-xl shadow-xl hover:bg-red-700 active:bg-red-800 touch-manipulation z-10 flex items-center justify-center"
          aria-label="Close radio"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Full radio page */}
        <div className="flex-1 overflow-hidden">
          <TwoWayRadio onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
