import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TextInputDialog({ open, onOpenChange, title, value, onSave, placeholder }) {
  const [text, setText] = useState(value || '');
  const textareaRef = useRef(null);

  useEffect(() => {
    if (open) setText(value || '');
  }, [open, value]);

  // Auto-focus and move cursor to end when dialog opens
  useEffect(() => {
    if (open && textareaRef.current) {
      const el = textareaRef.current;
      // Small delay for dialog animation
      setTimeout(() => {
        el.focus();
        el.setSelectionRange(el.value.length, el.value.length);
      }, 100);
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] flex flex-col"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[300px] max-h-[60vh] border rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(text); onOpenChange(false); }} className="bg-teal-600 hover:bg-teal-700">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
