import React from 'react';

export default function CustomFieldsViewer({ customFields, formConfig }) {
  if (!customFields || typeof customFields !== 'object' || Object.keys(customFields).length === 0) {
    return null;
  }

  const getSectionConfig = (sectionId) => {
    if (!formConfig?.sections) return null;
    return formConfig.sections.find(s => s.id === sectionId && s.type === 'custom') || null;
  };

  const getFieldConfig = (sectionConfig, fieldId) => {
    if (!sectionConfig?.fields) return null;
    return sectionConfig.fields.find(f => f.id === fieldId) || null;
  };

  const formatFieldId = (id) => {
    return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const renderValue = (value) => {
    if (value === null || value === undefined || value === '') {
      return <p className="text-sm font-medium text-slate-900">&mdash;</p>;
    }

    const lower = typeof value === 'string' ? value.toLowerCase() : '';

    if (lower === 'yes') {
      return (
        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-700">
          Yes
        </span>
      );
    }

    if (lower === 'no') {
      return (
        <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">
          No
        </span>
      );
    }

    if (Array.isArray(value)) {
      return (
        <p className="text-sm font-medium text-slate-900">
          {value.length > 0 ? value.join(', ') : '\u2014'}
        </p>
      );
    }

    return <p className="text-sm font-medium text-slate-900">{String(value)}</p>;
  };

  return (
    <>
      {Object.entries(customFields).map(([sectionId, fields]) => {
        if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) {
          return null;
        }

        const sectionConfig = getSectionConfig(sectionId);
        const sectionLabel = sectionConfig?.label || formatFieldId(sectionId);

        return (
          <div key={sectionId} className="border-l-4 border-teal-400 bg-teal-50 p-4 rounded">
            <p className="text-xs font-semibold text-teal-900 uppercase mb-2">{sectionLabel}</p>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(fields).map(([fieldId, value]) => {
                const fieldConfig = getFieldConfig(sectionConfig, fieldId);
                const fieldLabel = fieldConfig?.label || formatFieldId(fieldId);

                return (
                  <div key={fieldId} className="space-y-1">
                    <p className="text-xs text-slate-600">{fieldLabel}</p>
                    {renderValue(value)}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}
