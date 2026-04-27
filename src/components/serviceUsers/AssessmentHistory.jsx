import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck, Download, Plus, Calendar, User, FileText,
  Check, Minus, Loader2, AlertTriangle
} from 'lucide-react';

const SECTION_LABELS = {
  personal: 'Personal',
  emergency: 'Emergency',
  medical: 'Medical',
  care_plan: 'Care Plan',
  calls: 'Calls',
  meds: 'Meds & MAR',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function AssessmentHistory({ serviceUser, onStartAssessment }) {
  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['needsAssessments', serviceUser?.id],
    queryFn: () => base44.entities.NeedsAssessment.filter(
      { service_user_id: serviceUser.id },
      '-completed_at',
      50
    ),
    enabled: !!serviceUser?.id,
  });

  const handleDownloadPdf = async (assessment) => {
    if (assessment.pdf_url) {
      window.open(assessment.pdf_url, '_blank');
    }
  };

  const latestAssessment = assessments[0];
  const nextDue = latestAssessment?.next_reassessment_date;
  const overdue = isOverdue(nextDue);

  return (
    <div className="space-y-4">
      {/* Header with Next Due & Complete Button */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="font-semibold text-base flex items-center gap-2">
              <ClipboardCheck className="w-5 h-5 text-cyan-600" />
              Assessment of Needs
            </h3>
            {nextDue ? (
              <div className="flex items-center gap-2 mt-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className={`text-sm ${overdue ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                  Next re-assessment: {formatDate(nextDue)}
                  {overdue && (
                    <Badge className="ml-2 bg-red-100 text-red-700 border-red-200">
                      <AlertTriangle className="w-3 h-3 mr-1" /> Overdue
                    </Badge>
                  )}
                </span>
              </div>
            ) : (
              <p className="text-sm text-amber-600 mt-1 font-medium">No assessment completed yet — please complete an initial assessment</p>
            )}
          </div>
          <Button
            onClick={onStartAssessment}
            className="bg-gradient-to-r from-cyan-500 to-teal-600 hover:from-cyan-600 hover:to-teal-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            {assessments.length === 0 ? 'Start Initial Assessment' : 'Complete Re-Assessment'}
          </Button>
        </div>
      </Card>

      {/* Assessment History List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
        </div>
      ) : assessments.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardCheck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No assessments completed yet</p>
          <p className="text-slate-400 text-xs mt-1">Click the button above to start the initial assessment</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {assessments.map((a, idx) => (
            <Card key={a.id} className={`p-4 ${idx === 0 ? 'border-teal-200 bg-teal-50/30' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={a.assessment_type === 'initial'
                      ? 'bg-blue-100 text-blue-700 border-blue-200'
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                    }>
                      {a.assessment_type === 'initial' ? 'Initial Assessment' : 'Re-Assessment'}
                    </Badge>
                    {idx === 0 && <Badge className="bg-teal-100 text-teal-700 border-teal-200">Latest</Badge>}
                  </div>

                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {formatDate(a.completed_at)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {a.completed_by_name || 'Unknown'}
                    </span>
                  </div>

                  {/* Section breakdown */}
                  {a.sections_reviewed && Object.keys(a.sections_reviewed).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {Object.entries(SECTION_LABELS).map(([key, label]) => {
                        const status = a.sections_reviewed?.[key];
                        return (
                          <span
                            key={key}
                            className={`text-[10px] font-medium px-2 py-0.5 rounded-full border flex items-center gap-0.5
                              ${status === 'updated'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : status === 'no_changes'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200'}
                            `}
                          >
                            {status === 'updated' ? <FileText className="w-2.5 h-2.5" /> :
                             status === 'no_changes' ? <Check className="w-2.5 h-2.5" /> :
                             <Minus className="w-2.5 h-2.5" />}
                            {label}: {status === 'updated' ? 'Updated' : status === 'no_changes' ? 'No Changes' : 'N/A'}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {a.next_reassessment_date && (
                    <p className="text-xs text-slate-400 mt-2">
                      Next due: {formatDate(a.next_reassessment_date)}
                    </p>
                  )}
                </div>

                {a.pdf_url && (
                  <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(a)} className="flex-shrink-0">
                    <Download className="w-3.5 h-3.5 mr-1" /> PDF
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
