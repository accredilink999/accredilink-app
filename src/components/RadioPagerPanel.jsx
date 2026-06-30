import { Sheet, SheetContent } from '@/components/ui/sheet';
import TwoWayRadio from '@/pages/TwoWayRadio';

export default function RadioPagerPanel({ open, onOpenChange }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[480px] p-0 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <TwoWayRadio onClose={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
