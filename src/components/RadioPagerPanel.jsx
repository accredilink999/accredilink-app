import { Sheet, SheetContent } from '@/components/ui/sheet';
import { X } from 'lucide-react';
import TwoWayRadio from '@/pages/TwoWayRadio';

export default function RadioPagerPanel({ open, onOpenChange }) {
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <TwoWayRadio onClose={() => onOpenChange(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Fixed close tab — always reachable on the left edge of the screen */}
      {open && (
        <button
          onClick={() => onOpenChange(false)}
          className="fixed left-0 top-24 z-[99999] bg-red-600 text-white py-4 px-2 rounded-r-xl shadow-xl hover:bg-red-700 active:bg-red-800 touch-manipulation"
          aria-label="Close radio"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </>
  );
}
