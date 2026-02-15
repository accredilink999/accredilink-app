import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical } from 'lucide-react';
import FormFieldRenderer from './FormFieldRenderer';

export default function FormCanvas({
  fields,
  selectedFieldId,
  onFieldSelect,
  onDragOver,
  onDrop,
  onDeleteField,
  onReorderFields,
  onUpdateField
}) {
  const [draggedIndex, setDraggedIndex] = React.useState(null);
  const [editingFieldId, setEditingFieldId] = React.useState(null);
  const [editingLabel, setEditingLabel] = React.useState('');

  const handleFieldDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleFieldDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      onReorderFields(draggedIndex, index);
      setDraggedIndex(null);
    }
  };

  const handleFieldDoubleClick = (field) => {
    setEditingFieldId(field.id);
    setEditingLabel(field.label);
  };

  const handleSaveEdit = (fieldId) => {
    if (editingLabel.trim()) {
      onUpdateField(fieldId, { label: editingLabel });
    }
    setEditingFieldId(null);
  };

  return (
    <div className="flex-1 p-8 mt-20 overflow-y-auto" onDragOver={onDragOver} onDrop={(e) => onDrop(e, 0)}>
      <Card className="bg-white p-8 min-h-full">
        {fields.length === 0 ? (
          <div 
            className="text-center py-12"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onDrop(e, 0);
            }}
          >
            <p className="text-slate-500 text-lg">Drag form elements here to build your form</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                draggable
                onDragStart={(e) => handleFieldDragStart(e, index)}
                onDragOver={handleFieldDragOver}
                onDrop={(e) => handleFieldDrop(e, index)}
                onClick={() => onFieldSelect(field.id)}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all group ${
                  selectedFieldId === field.id
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <GripVertical className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100" />
                  <div className="flex-1 min-w-0">
                    {editingFieldId === field.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingLabel}
                        onChange={(e) => setEditingLabel(e.target.value)}
                        onBlur={() => handleSaveEdit(field.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(field.id);
                          if (e.key === 'Escape') setEditingFieldId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 border border-teal-500 rounded text-sm font-medium focus:outline-none"
                      />
                    ) : (
                      <div onDoubleClick={() => handleFieldDoubleClick(field)}>
                        <FormFieldRenderer field={field} preview={true} />
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDrop(e, fields.length);
              }}
              className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-teal-400 transition-colors"
            >
              <p className="text-slate-400 text-sm">Drop elements here</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}