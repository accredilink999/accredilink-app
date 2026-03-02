import React, { useState, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Loader2, Languages } from 'lucide-react';
import ReadOnlyMARCard from "@/components/medications/ReadOnlyMARCard";
import { useLanguage } from '@/lib/LanguageContext';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function CarePlanViewer({ serviceUser }) {
  const { language, t } = useLanguage();
  const [translatedContent, setTranslatedContent] = useState({});
  const [isTranslating, setIsTranslating] = useState(false);

  // Collect all translatable text fields
  const getTranslatableFields = useCallback(() => {
    const fields = {};
    const textKeys = [
      'what_matters_to_me', 'quick_reference', 'brief_history',
      'communication_needs', 'medical_history', 'personal_plan_aims',
      'assistance_equipment', 'pets_in_property', 'risk_management',
      'risk_assessments', 'allergies', 'dietary_requirements',
      'emergency_shutoff_water', 'emergency_shutoff_electricity', 'emergency_shutoff_gas'
    ];
    for (const key of textKeys) {
      if (serviceUser[key]) fields[key] = serviceUser[key];
    }
    // Person-centred plan sections
    if (serviceUser.person_centred_plan) {
      try {
        const calls = JSON.parse(serviceUser.person_centred_plan);
        if (Array.isArray(calls)) {
          calls.forEach((call, i) => {
            if (call.section1) fields[`pcp_${i}_s1`] = call.section1;
            if (call.section2) fields[`pcp_${i}_s2`] = call.section2;
            if (call.section3) fields[`pcp_${i}_s3`] = call.section3;
          });
        }
      } catch { /* ignore */ }
    }
    // Risk assessment rows
    if (serviceUser.risk_assessment_rows) {
      try {
        const rows = JSON.parse(serviceUser.risk_assessment_rows);
        if (Array.isArray(rows)) {
          rows.forEach((row, i) => {
            if (row.col2) fields[`risk_${i}_col2`] = row.col2;
            if (row.col3) fields[`risk_${i}_col3`] = row.col3;
          });
        }
      } catch { /* ignore */ }
    }
    return fields;
  }, [serviceUser]);

  const handleTranslate = async () => {
    const fields = getTranslatableFields();
    const entries = Object.entries(fields);
    if (entries.length === 0) {
      toast.info('No content to translate');
      return;
    }

    setIsTranslating(true);
    try {
      const textBlock = entries.map(([key, val]) => `[${key}]\n${val}`).join('\n\n---\n\n');
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following care plan content from English to Welsh (Cymraeg). This is for a domiciliary care plan in Wales and must use appropriate Welsh care sector terminology.

IMPORTANT:
- Translate ONLY the content text, not the [key] markers
- Keep the exact same [key] markers as section separators
- Maintain the same formatting and line breaks
- Do not add or remove any content
- Use professional Welsh suitable for care documentation

Content to translate:

${textBlock}

Return ONLY the translated text with the same [key] markers. Do not add any explanation or extra text.`,
        response_json_schema: null,
      });

      // Parse the translated result back into key-value pairs
      const translated = {};
      const rawText = typeof result === 'string' ? result : (result?.text || result?.content || JSON.stringify(result));
      const sections = rawText.split(/---|\n\[/).filter(Boolean);

      for (const section of sections) {
        const match = section.match(/\[?(\w+)\]?\s*\n([\s\S]*)/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim();
          if (key && value) translated[key] = value;
        }
      }

      if (Object.keys(translated).length > 0) {
        setTranslatedContent(translated);
        toast.success('Content translated to Cymraeg');
      } else {
        toast.error('Translation failed — could not parse result');
      }
    } catch (err) {
      console.error('Translation error:', err);
      toast.error('Translation failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsTranslating(false);
    }
  };

  // Helper: get content — translated if available and Welsh selected, otherwise original
  const c = (fieldKey, originalValue) => {
    if (language === 'cy' && translatedContent[fieldKey]) {
      return translatedContent[fieldKey];
    }
    return originalValue;
  };

  if (!serviceUser) return null;

  const renderTranslateButton = () => {
    if (language !== 'cy') return null;
    if (Object.keys(translatedContent).length > 0) {
      return (
        <Card className="p-2 bg-green-50 border-green-200">
          <p className="text-xs text-green-700 text-center">Content translated to Cymraeg</p>
        </Card>
      );
    }
    return (
      <Card className="p-3 bg-amber-50 border-amber-200">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-amber-700">Content is in English. Translate to Welsh?</p>
          <Button
            size="sm"
            onClick={handleTranslate}
            disabled={isTranslating}
            className="bg-red-600 hover:bg-red-700 text-xs flex-shrink-0"
          >
            {isTranslating ? (
              <><Loader2 className="w-3 h-3 mr-1 animate-spin" />Translating...</>
            ) : (
              <><Languages className="w-3 h-3 mr-1" />Translate to Cymraeg</>
            )}
          </Button>
        </div>
      </Card>
    );
  };

  const renderContactInfo = () => {
    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('contactInformation')}</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          {serviceUser.address && (
            <div>
              <span className="text-slate-500">{t('address')}:</span>
              <p className="text-slate-900 break-words">{serviceUser.address}</p>
              {serviceUser.postcode && <p className="text-slate-900">{serviceUser.postcode}</p>}
            </div>
          )}
          {serviceUser.phone && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-500">{t('phone')}:</span>
              <a href={`tel:${serviceUser.phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all">
                {serviceUser.phone}
              </a>
            </div>
          )}
          {serviceUser.key_safe_code && (
            <div>
              <span className="text-slate-500">{t('keySafeCode')}:</span>
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
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('emergencyContact')}</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          {serviceUser.emergency_contact_name && (
            <div>
              <span className="text-slate-500">{t('name')}:</span>
              <p className="text-slate-900 break-words">{serviceUser.emergency_contact_name}</p>
            </div>
          )}
          {serviceUser.emergency_contact_phone && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="text-slate-500">{t('phone')}:</span>
              <a href={`tel:${serviceUser.emergency_contact_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors break-all">
                {serviceUser.emergency_contact_phone}
              </a>
            </div>
          )}
          {serviceUser.emergency_contact_relationship && (
            <div>
              <span className="text-slate-500">{t('relationship')}:</span>
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
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('medicalInformation')}</h4>
        <div className="space-y-2 text-xs sm:text-sm">
          {serviceUser.gp_name && (
            <div>
              <span className="text-slate-500">{t('gp')}:</span>
              <p className="text-slate-900 break-words">{serviceUser.gp_name}</p>
              {serviceUser.gp_phone && <p className="text-slate-600 break-all"><a href={`tel:${serviceUser.gp_phone}`} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors">{serviceUser.gp_phone}</a></p>}
            </div>
          )}
          {serviceUser.nhs_number && (
            <div>
              <span className="text-slate-500">{t('nhsNumber')}:</span>
              <p className="text-slate-900 break-all">{serviceUser.nhs_number}</p>
            </div>
          )}
          {serviceUser.allergies && (
            <div>
              <span className="text-slate-500">{t('allergies')}:</span>
              <p className="text-slate-900 break-words">{c('allergies', serviceUser.allergies)}</p>
            </div>
          )}
          {serviceUser.dietary_requirements && (
            <div>
              <span className="text-slate-500">{t('dietaryRequirements')}:</span>
              <p className="text-slate-900 break-words">{c('dietary_requirements', serviceUser.dietary_requirements)}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  const renderSection = (titleKey, content, fieldKey) => {
    if (!content) return null;
    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t(titleKey)}</h4>
        <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-wrap break-words">{c(fieldKey || titleKey, content)}</p>
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
          <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('personCentredPlan')}</h4>
          <div className="space-y-4">
            {calls.map((call, idx) => (
              <div key={idx} className="border-l-4 border-teal-300 pl-3 sm:pl-4 pb-4 last:pb-0">
                <p className="font-semibold text-slate-900 mb-3 text-xs sm:text-sm break-words">{call.call_number}</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">{t('section1IntendedOutcome')}</p>
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{c(`pcp_${idx}_s1`, call.section1)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">{t('section2NeedsPreferences')}</p>
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{c(`pcp_${idx}_s2`, call.section2)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-teal-700 mb-1">{t('section3CareStaffActions')}</p>
                    <p className="text-xs sm:text-sm text-slate-700 break-words">{c(`pcp_${idx}_s3`, call.section3)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    } catch {
      return renderSection('personCentredPlan', serviceUser.person_centred_plan, 'person_centred_plan');
    }
  };

  const renderRiskAssessments = () => {
    if (!serviceUser.risk_assessment_rows) return renderSection('riskManagement', serviceUser.risk_management, 'risk_management');

    try {
      const rows = JSON.parse(serviceUser.risk_assessment_rows);
      if (!Array.isArray(rows) || rows.length === 0) return renderSection('riskManagement', serviceUser.risk_management, 'risk_management');

      return (
        <Card className="p-3 sm:p-4">
          <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('managingRisk')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-slate-300 rounded-lg text-[11px] sm:text-xs">
              <thead>
                <tr className="bg-slate-200">
                  <th className="border-r border-slate-300 px-0.5 py-1 sm:p-2 font-semibold text-slate-700 text-left text-[9px] sm:text-xs whitespace-nowrap">{t('risk')}</th>
                  <th className="border-r border-slate-300 px-1.5 py-1 sm:p-2 font-semibold text-slate-700 text-left">{t('personSpecificRisks')}</th>
                  <th className="px-1.5 py-1 sm:p-2 font-semibold text-slate-700 text-left">{t('managingTheRisks')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    <td className="border-r border-slate-300 px-0.5 py-1 sm:p-2 font-semibold text-slate-700 break-words align-top text-[9px] sm:text-xs whitespace-normal">
                      {row.col1}
                    </td>
                    <td className="border-r border-slate-300 px-1.5 py-1 sm:p-2 text-slate-600 whitespace-pre-wrap break-words align-top">
                      {c(`risk_${index}_col2`, row.col2)}
                    </td>
                    <td className="px-1.5 py-1 sm:p-2 text-slate-600 whitespace-pre-wrap break-words align-top">
                      {c(`risk_${index}_col3`, row.col3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      );
    } catch {
      return renderSection('riskManagement', serviceUser.risk_management, 'risk_management');
    }
  };

  const renderRiskAssessmentFiles = () => {
    const files = serviceUser.risk_assessment_files;
    if (!files || !Array.isArray(files) || files.length === 0) return null;

    return (
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('riskAssessmentAttachments')}</h4>
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
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('emergencyShutoffs')}</h4>
        <div className="space-y-3 text-xs sm:text-sm">
          {serviceUser.emergency_shutoff_water && (
            <div>
              <span className="text-slate-500 font-medium">{t('water')}:</span>
              <p className="text-slate-700 mt-1 break-words">{c('emergency_shutoff_water', serviceUser.emergency_shutoff_water)}</p>
            </div>
          )}
          {serviceUser.emergency_shutoff_electricity && (
            <div>
              <span className="text-slate-500 font-medium">{t('electricity')}:</span>
              <p className="text-slate-700 mt-1 break-words">{c('emergency_shutoff_electricity', serviceUser.emergency_shutoff_electricity)}</p>
            </div>
          )}
          {serviceUser.emergency_shutoff_gas && (
            <div>
              <span className="text-slate-500 font-medium">{t('gas')}:</span>
              <p className="text-slate-700 mt-1 break-words">{c('emergency_shutoff_gas', serviceUser.emergency_shutoff_gas)}</p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {renderTranslateButton()}
      {renderContactInfo()}
      {renderEmergencyContact()}
      {renderMedicalInfo()}
      {renderSection('whatMattersToMe', serviceUser.what_matters_to_me, 'what_matters_to_me')}
      {renderSection('quickReference', serviceUser.quick_reference, 'quick_reference')}
      {renderSection('briefHistory', serviceUser.brief_history, 'brief_history')}
      {renderSection('communicationNeeds', serviceUser.communication_needs, 'communication_needs')}
      {renderSection('medicalHistory', serviceUser.medical_history, 'medical_history')}
      <ReadOnlyMARCard serviceUser={serviceUser} />
      {renderSection('personalPlanAims', serviceUser.personal_plan_aims, 'personal_plan_aims')}
      {renderSection('assistanceEquipment', serviceUser.assistance_equipment, 'assistance_equipment')}
      {renderEmergencyShutoffs()}
      {renderSection('petsInProperty', serviceUser.pets_in_property, 'pets_in_property')}
      {renderRiskAssessments()}
      {renderRiskAssessmentFiles()}
      {renderSection('additionalRiskNotes', serviceUser.risk_assessments, 'risk_assessments')}
      {renderPersonCentredCalls()}
      {(serviceUser.care_plan_date || serviceUser.plan_completed_by || serviceUser.plan_review_date) && (
        <Card className="p-3 sm:p-4 bg-slate-50 border-teal-200">
          <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">{t('planDocumentation')}</h4>
          <div className="space-y-2 text-xs sm:text-sm">
            {serviceUser.care_plan_date && (
              <p className="text-slate-600 break-words"><span className="text-slate-500">{t('dateOfPlan')}:</span> {serviceUser.care_plan_date}</p>
            )}
            {serviceUser.plan_completed_by && (
              <p className="text-slate-600 break-words"><span className="text-slate-500">{t('completedSignedBy')}:</span> {serviceUser.plan_completed_by}</p>
            )}
            {serviceUser.plan_review_date && (
              <p className="text-slate-600 break-words"><span className="text-slate-500">{t('planReviewDate')}:</span> {serviceUser.plan_review_date}</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
