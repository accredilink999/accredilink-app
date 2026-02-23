import React, { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";
import TextInputDialog from "@/components/ui/TextInputDialog";

/**
 * A textarea with an expand button that opens a full-size dialog for easier editing.
 * Props:
 *  - value: current text value
 *  - onChange: (newValue) => void
 *  - label: dialog title when expanded
 *  - placeholder: placeholder text
 *  - rows: number of rows for the inline preview textarea (default 2)
 *  - className: additional classes for the wrapper
 */
export default function ExpandableTextarea({ value, onChange, label, placeholder, rows = 2, className = '' }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        className="absolute top-2 right-2 p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
        title="Expand to full editor"
      >
        <Maximize2 className="w-4 h-4" />
      </button>
      <TextInputDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={label || placeholder || 'Edit Text'}
        value={value || ''}
        onSave={(newText) => onChange(newText)}
        placeholder={placeholder}
      />
    </div>
  );
}
