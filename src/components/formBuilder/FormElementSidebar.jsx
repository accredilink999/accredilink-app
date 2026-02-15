import React from 'react';
import { Card } from "@/components/ui/card";

export default function FormElementSidebar({ elements, onDragStart }) {
  return (
    <div className="w-48 bg-white border-r border-slate-200 p-4 overflow-y-auto">
      <h3 className="font-semibold text-slate-900 mb-4">Form Elements</h3>
      <div className="space-y-2">
        {elements.map(element => (
          <div
            key={element.id}
            draggable
            onDragStart={(e) => onDragStart(e, element.id)}
            className="p-3 bg-slate-50 border border-slate-200 rounded-lg cursor-move hover:bg-slate-100 transition-colors"
          >
            <div className="text-xl mb-1">{element.icon}</div>
            <div className="text-sm font-medium text-slate-900">{element.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}