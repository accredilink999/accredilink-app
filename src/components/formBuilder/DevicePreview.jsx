import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Monitor, Smartphone, X } from 'lucide-react';
import FormPreview from './FormPreview';

export default function DevicePreview({ form, onClose }) {
  const [device, setDevice] = useState('desktop');

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg flex flex-col h-full max-h-[90vh] w-full max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Form Preview</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Device Toggle */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 bg-slate-50">
          <span className="text-sm font-medium text-slate-700">Preview:</span>
          <Button
            variant={device === 'desktop' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('desktop')}
            className={device === 'desktop' ? 'bg-teal-600' : ''}
          >
            <Monitor className="w-4 h-4 mr-2" />
            Desktop
          </Button>
          <Button
            variant={device === 'mobile' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDevice('mobile')}
            className={device === 'mobile' ? 'bg-teal-600' : ''}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            Mobile
          </Button>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto bg-slate-100 p-4 flex items-start justify-center">
          <div
            className={`bg-white rounded-lg shadow-md ${
              device === 'mobile' ? 'w-96 max-w-full' : 'w-full max-w-2xl'
            }`}
          >
            <FormPreview form={form} onBack={() => {}} preview={true} />
          </div>
        </div>
      </div>
    </div>
  );
}