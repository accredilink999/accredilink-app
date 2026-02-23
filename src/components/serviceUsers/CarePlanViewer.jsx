import React from 'react';
import { Card } from "@/components/ui/card";
import { FileText, Download } from 'lucide-react';
import ReadOnlyMARCard from "@/components/medications/ReadOnlyMARCard";

export default function CarePlanViewer({ serviceUser }) {
  if (!serviceUser) return null;

  const renderContactInfo = () => {
    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Contact Information</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          {serviceUser.address && (
            <div>
              <span className="text-slate-500">Address:</span>
              <p className="text-slate-900 break-words">{serviceUser.address}</p>
              {serviceUser.postcode && <p className="text-slate-900">{serviceUser.postcode}</p>}
            </div>
          )}
          {serviceUser.phone && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-500">Phone:</span>
              <a href={`tel:${serviceUser.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all">
                {serviceUser.phone}
              </a>
            </div>
          )}
          {serviceUser.key_safe_code && (
            <div>
              <span className="text-slate-500">Key Safe Code:</span>
              <p className="font-mono text-slate-900 break-all">{serviceUser.key_safe_code}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderEmergencyContact = () => {
    if (!serviceUser.emergency_contact_name && !serviceUser.emergency_contact_phone && !serviceUser.emergency_contact_relationship) {
      return null;
    }
    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Emergency Contact</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          {serviceUser.emergency_contact_name && (
            <div>
              <span className="text-slate-500">Name:</span>
              <p className="text-slate-900 break-words">{serviceUser.emergency_contact_name}</p>
            </div>
          )}
          {serviceUser.emergency_contact_phone && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-500">Phone:</span>
              <a href={`tel:${serviceUser.emergency_contact_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all">
                {serviceUser.emergency_contact_phone}
              </a>
            </div>
          )}
          {serviceUser.emergency_contact_relationship && (
            <div>
              <span className="text-slate-500">Relationship:</span>
              <p className="text-slate-900 break-words">{serviceUser.emergency_contact_relationship}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderMedicalInfo = () => {
    if (!serviceUser.gp_name && !serviceUser.nhs_number && !serviceUser.allergies && !serviceUser.dietary_requirements) {
      return null;
    }
    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Medical Information</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          {serviceUser.gp_name && (
            <div>
              <span className="text-slate-500">GP:</span>
              <p className="text-slate-900 break-words">{serviceUser.gp_name}</p>
              {serviceUser.gp_phone && <p className="text-slate-600 break-all"><a href={`tel:${serviceUser.gp_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{serviceUser.gp_phone}</a></p>}
            </div>
          )}
          {serviceUser.nhs_number && (
            <div>
              <span className="text-slate-500">NHS Number:</span>
              <p className="text-slate-900 break-all">{serviceUser.nhs_number}</p>
            </div>
          )}
          {serviceUser.allergies && (
            <div>
              <span className="text-slate-500">Allergies:</span>
              <p className="text-slate-900 break-words">{serviceUser.allergies}</p>
            </div>
          )}
          {serviceUser.dietary_requirements && (
            <div>
              <span className="text-slate-500">Dietary Requirements:</span>
              <p className="text-slate-900 break-words">{serviceUser.dietary_requirements}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderSection = (title, content) => {
    if (!content) return null;
    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{title}</h4>
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words">{content}</p>
      </Card>
    );
  };

  const renderPersonCentredCalls = () => {
    if (!serviceUser.person_centred_plan) return null;
    
    try {
      const calls = JSON.parse(serviceUser.person_centred_plan);
      if (!Array.isArray(calls) || calls.length === 0) return null;

      return (
        <Card className="p-3 sm:p-4">
          <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Person Centred Plan By Call</h4>
          <div className="space-y-4">
            {calls.map((call, idx) => (
              <div key={idx} className="border-l-4 border-teal-300 pl-3 sm:pl-4 pb-4 last:pb-0">
                <p className="font-semibold text-slate-900 mb-3 text-xs sm:text-sm break-words">{call.call_number}</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">Section 1: Intended Outcome</p>
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{call.section1}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">Section 2: Needs & Preferences</p>
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{call.section2}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">Section 3: Care Staff Actions</p>
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{call.section3}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    } catch {
      return renderSection('Person Centred Plan By Call', serviceUser.person_centred_plan);
    }
  };

  const renderRiskAssessments = () => {
    if (!serviceUser.risk_assessment_rows) return renderSection('Risk Management', serviceUser.risk_management);

    try {
      const rows = JSON.parse(serviceUser.risk_assessment_rows);
      if (!Array.isArray(rows) || rows.length === 0) return renderSection('Risk Management', serviceUser.risk_management);

      return (
        <Card className="p-3 sm:p-4">
          <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Managing Risk</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 rounded-lg text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border-r border-slate-300 px-0.5 py-1 sm:p-2 font-semibold text-slate-700 text-left text-[9px] sm:text-xs whitespace-nowrap">Risk</th>
                  <th className="border-r border-slate-300 px-1.5 py-1 sm:p-2 font-semibold text-slate-700 text-left">Person Specific Risks</th>
                  <th className="px-1.5 py-1 sm:p-2 font-semibold text-slate-700 text-left">Managing The Risks</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border-r border-slate-300 px-0.5 py-1 sm:p-2 font-semibold text-slate-700 break-words align-top text-[9px] sm:text-xs whitespace-normal">
                      {row.col1}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-1 sm:p-2 text-slate-600 whitespace-pre-wrap break-words align-top">
                      {row.col2}
                    </td>
                    <td className="px-1.5 py-1 sm:p-2 text-slate-600 whitespace-pre-wrap break-words align-top">
                      {row.col3}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );
    } catch {
      return renderSection('Risk Management', serviceUser.risk_management);
    }
  };

  const renderRiskAssessmentFiles = () => {
    const files = serviceUser.risk_assessment_files;
    if (!files || !Array.isArray(files) || files.length === 0) return null;

    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Risk Assessment Attachments</h4>
        <div className="space-y-2">
          {files.map((file, idx) => (
            <a
              key={file.id || idx}
              href={file.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 transition-colors"
            >
              <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <span className="text-sm text-slate-700 truncate flex-1">{file.name || `Attachment ${idx + 1}`}</span>
              <Download className="w-4 h-4 text-slate-400" />
            </a>
          ))}
        </div>
      </Card>
    );
  };

  const renderEmergencyShutoffs = () => {
    if (!serviceUser.emergency_shutoff_water && !serviceUser.emergency_shutoff_electricity && !serviceUser.emergency_shutoff_gas) {
      return null;
    }

    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Location Of Emergency Shut Offs In The Property</h4>
        <div className="space-y-3 text-xs sm:text-sm">
          {serviceUser.emergency_shutoff_water && (
            <div>
              <span className="text-slate-500 font-medium">Water:</span>
              <p className="text-slate-700 mt-1 break-words">{serviceUser.emergency_shutoff_water}</p>
            </div>
          )}
          {serviceUser.emergency_shutoff_electricity && (
            <div>
              <span className="text-slate-500 font-medium">Electricity:</span>
              <p className="text-slate-700 mt-1 break-words">{serviceUser.emergency_shutoff_electricity}</p>
            </div>
          )}
          {serviceUser.emergency_shutoff_gas && (
            <div>
              <span className="text-slate-500 font-medium">Gas:</span>
              <p className="text-slate-700 mt-1 break-words">{serviceUser.emergency_shutoff_gas}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderContactInfo()}
      {renderEmergencyContact()}
      {renderMedicalInfo()}
      {renderSection('What Matters To Me', serviceUser.what_matters_to_me)}
      {renderSection('My Quick Reference & Preferences', serviceUser.quick_reference)}
      {renderSection('Brief History Of Me', serviceUser.brief_history)}
      {renderSection('Communication Needs', serviceUser.communication_needs)}
      {renderSection('My Medical History', serviceUser.medical_history)}
      <ReadOnlyMARCard serviceUser={serviceUser} />
      {renderSection('Overall Aims Of The Personal Plan', serviceUser.personal_plan_aims)}
      {renderSection('Assistance Equipment In the Property', serviceUser.assistance_equipment)}
      {renderEmergencyShutoffs()}
      {renderSection('Pets In Property', serviceUser.pets_in_property)}
      {renderRiskAssessments()}
      {renderRiskAssessmentFiles()}
      {renderSection('Additional Risk Notes', serviceUser.risk_assessments)}
      {renderPersonCentredCalls()}
      {(serviceUser.care_plan_date || serviceUser.plan_completed_by || serviceUser.plan_review_date) && (
        <Card className="p-3 sm:p-4 bg-slate-50 border-teal-200">
          <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Plan Documentation</h4>
          <div className="space-y-2 text-xs sm:text-sm">
            {serviceUser.care_plan_date && (
              <p className="text-slate-600 break-words"><span className="text-slate-500">Date of Plan:</span> {serviceUser.care_plan_date}</p>
            )}
            {serviceUser.plan_completed_by && (
              <p className="text-slate-600 break-words"><span className="text-slate-500">Completed/Signed By:</span> {serviceUser.plan_completed_by}</p>
            )}
            {serviceUser.plan_review_date && (
              <p className="text-slate-600 break-words"><span className="text-slate-500">Plan Review Date:</span> {serviceUser.plan_review_date}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}