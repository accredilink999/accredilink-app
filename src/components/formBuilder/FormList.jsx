import React from 'react';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, Copy } from 'lucide-react';
import EmptyState from '@/components/ui/EmptyState';

export default function FormList({ forms, onEdit, onPreview, onDelete }) {
  if (forms.length === 0) {
    return (
      <EmptyState
        icon={Edit}
        title="No forms yet"
        description="Create your first form to get started"
      />
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {forms.map(form => (
        <Card key={form.id} className="p-6 bg-white border-0 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="font-semibold text-slate-900 truncate mb-2">{form.title}</h3>
          {form.description && (
            <p className="text-sm text-slate-500 line-clamp-2 mb-4">{form.description}</p>
          )}
          
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-4">
            <span>{format(new Date(form.created_date), 'dd MMM yyyy')}</span>
            <span>•</span>
            <span>{JSON.parse(form.schema || '[]').length} fields</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(form)}
              className="flex-1"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onPreview(form)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(form)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}