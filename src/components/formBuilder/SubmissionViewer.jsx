import React, { useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import FormFieldRenderer from './FormFieldRenderer';

export default function SubmissionViewer({ submission, form, onBack }) {
  const [userCompanyData, setUserCompanyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const formData = JSON.parse(submission.submission_data || '{}');
  const fields = JSON.parse(form.schema || '[]');

  useEffect(() => {
    base44.auth.me().then(user => {
      setUserCompanyData(user);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{form.title}</h1>
          <p className="text-slate-600 text-sm mt-1">
            Submitted by {submission.submitter_email} • {new Date(submission.created_date).toLocaleDateString()}
          </p>
        </div>
      </div>

      <Card className="max-w-2xl mx-auto p-8">
         {!loading && userCompanyData && fields.some(f => f.type === 'company-header') && (
           <div className="mb-8">
             <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-8 py-6 text-white">
               <div className="flex items-center justify-between gap-8">
                 <div className="flex-shrink-0">
                   {userCompanyData.company_logo_url ? (
                     <img 
                       src={userCompanyData.company_logo_url} 
                       alt="Company Logo" 
                       className="h-24 w-auto object-contain bg-white rounded-lg p-2"
                     />
                   ) : (
                     <div className="h-24 w-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white text-sm">
                       No logo
                     </div>
                   )}
                 </div>
                 <div className="flex-1">
                   <h2 className="text-3xl font-bold">{userCompanyData.company_name || 'Company Name'}</h2>
                   <p className="text-blue-100 text-lg mt-2">{userCompanyData.company_contact_number || 'Contact Number'}</p>
                 </div>
               </div>
             </div>
           </div>
         )}

         {form.description && (
           <p className="text-slate-600 text-sm mb-6">{form.description}</p>
         )}

         <div className="space-y-6">
           {fields.map(field => (
            <div key={field.id} className="pb-6 border-b border-slate-200 last:border-0 last:pb-0">
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              <div className="text-slate-700 whitespace-pre-wrap break-words">
                {formData[field.id] ? String(formData[field.id]) : <span className="text-slate-400 italic">No response</span>}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}