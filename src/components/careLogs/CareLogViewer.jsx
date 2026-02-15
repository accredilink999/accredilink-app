import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, X, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from "@/components/ui/button";
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CareLogEditForm from './CareLogEditForm';

export default function CareLogViewer({ careLog, open, onOpenChange, isAdmin = false }) {
  if (!careLog) return null;

  const [isEditMode, setIsEditMode] = useState(false);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: staffMembers = [] } = useQuery({
    queryKey: ['staffMembers'],
    queryFn: async () => {
      const users = await base44.entities.User.list('-created_date', 1000);
      return users.map(u => ({ id: u.id, name: u.staff_full_name || u.full_name }));
    },
  });

  const userIsAdmin = isAdmin || currentUser?.role === 'admin';
  
  const getStaffName = (staffId) => {
    const staff = staffMembers.find(s => s.id === staffId);
    return staff?.name || staffId;
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'submitted':
        return { icon: CheckCircle2, color: 'bg-green-100 text-green-700', label: 'Submitted' };
      case 'overdue':
        return { icon: AlertCircle, color: 'bg-red-100 text-red-700', label: 'Overdue' };
      case 'pending':
        return { icon: Clock, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' };
      default:
        return { icon: Clock, color: 'bg-slate-100 text-slate-700', label: status };
    }
  };

  const statusConfig = getStatusConfig(careLog.status);
  const StatusIcon = statusConfig.icon;

  if (isEditMode) {
    return (
      <CareLogEditForm
        careLog={careLog}
        open={open}
        onOpenChange={onOpenChange}
        onClose={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="sticky top-0 bg-white pb-4">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-lg">Care Log</DialogTitle>
              <p className="text-sm text-slate-500 mt-1">
                {format(new Date(careLog.visit_date), 'EEEE, d MMMM yyyy')} • {careLog.visit_time}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {userIsAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditMode(true)}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </Button>
              )}
              <Badge className={statusConfig.color}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {statusConfig.label}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pb-4">
          {/* Service User & Staff Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Service User</p>
              <p className="text-sm font-medium text-slate-900">{careLog.service_user_name}</p>
            </div>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Recorded By</p>
              <p className="text-sm font-medium text-slate-900">{careLog.staff_name}</p>
            </div>
          </div>

          {/* Vital Signs */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 uppercase mb-3">Client Observations</p>
            <div className="grid grid-cols-4 gap-3">
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-xs text-slate-600 mb-1">Mood</p>
                <p className="font-medium text-slate-900 capitalize text-sm">{careLog.mood || '—'}</p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-xs text-slate-600 mb-1">Food Intake</p>
                <p className="font-medium text-slate-900 capitalize text-sm">{careLog.food_intake || '—'}</p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-xs text-slate-600 mb-1">Fluid Intake</p>
                <p className="font-medium text-slate-900 capitalize text-sm">{careLog.fluid_intake || '—'}</p>
              </div>
              <div className="bg-white p-3 rounded border border-blue-100">
                <p className="text-xs text-slate-600 mb-1">Duration</p>
                <p className="font-medium text-slate-900 text-sm">{careLog.duration_minutes || '—'} mins</p>
              </div>
            </div>
          </div>

          {/* Care Provided Checkboxes */}
          {(careLog.personal_care || careLog.continence_care_provided || careLog.catheter_care_provided || careLog.repositioned_on_visit || careLog.skincare_provided) && (
            <div className="grid grid-cols-3 gap-3 bg-teal-50 border border-teal-200 rounded-lg p-4">
              {careLog.personal_care && (
                <div className="text-sm font-medium text-teal-900">✓ Personal Care: {careLog.personal_care}</div>
              )}
              {careLog.continence_care_provided && (
                <div className="text-sm font-medium text-teal-900">✓ Continence Care: {careLog.continence_care_provided}</div>
              )}
              {careLog.catheter_care_provided && (
                <div className="text-sm font-medium text-teal-900">✓ Catheter Care: {careLog.catheter_care_provided}</div>
              )}
              {careLog.repositioned_on_visit && (
                <div className="text-sm font-medium text-teal-900">✓ Repositioned: {careLog.repositioned_on_visit}</div>
              )}
              {careLog.skincare_provided && (
                <div className="text-sm font-medium text-teal-900">✓ Skincare: {careLog.skincare_provided}</div>
              )}
            </div>
          )}

          {/* Medications */}
          {careLog.medications_given && careLog.medications_given.length > 0 && (
            <div className="border-l-4 border-purple-400 bg-purple-50 p-4 rounded">
              <p className="text-xs font-semibold text-purple-900 uppercase mb-2">Medications Given</p>
              <div className="flex flex-wrap gap-2">
                {careLog.medications_given.map((med, idx) => (
                  <Badge key={idx} variant="outline" className="bg-white">{med}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {careLog.activities && careLog.activities.length > 0 && (
            <div className="border-l-4 border-green-400 bg-green-50 p-4 rounded">
              <p className="text-xs font-semibold text-green-900 uppercase mb-2">Activities Completed</p>
              <ul className="space-y-1">
                {careLog.activities.map((activity, idx) => (
                  <li key={idx} className="text-sm text-green-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {activity.activity}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Health Observations */}
          {careLog.health_observations && (
            <div className="border-l-4 border-amber-400 bg-amber-50 p-4 rounded">
              <p className="text-xs font-semibold text-amber-900 uppercase mb-2">Health Observations</p>
              <p className="text-sm text-amber-900 leading-relaxed">{careLog.health_observations}</p>
            </div>
          )}

          {/* Incidents */}
          {careLog.incidents && (
            <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
              <p className="text-xs font-semibold text-red-900 uppercase mb-2">⚠️ Incidents Reported</p>
              <p className="text-sm text-red-900 leading-relaxed">{careLog.incidents}</p>
            </div>
          )}

          {/* Extended Notes */}
          {careLog.extended_notes && (
            <div className="border-l-4 border-indigo-400 bg-indigo-50 p-4 rounded">
              <p className="text-xs font-semibold text-indigo-900 uppercase mb-2">Extended Notes</p>
              <p className="text-sm text-indigo-900 leading-relaxed">{careLog.extended_notes}</p>
            </div>
          )}

          {/* Assessment Questions */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-slate-900 uppercase mb-4">Assessment Questions</p>
            <div className="grid grid-cols-2 gap-4">
              {careLog.welfare_impression_on_arrival && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Welfare Impression on Arrival?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.welfare_impression_on_arrival.replace(/_/g, ' ')}</p>
                </div>
              )}
              {careLog.personal_care && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Personal Care Provided?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.personal_care}</p>
                </div>
              )}
              {careLog.continence_care_provided && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Continence Care Provided?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.continence_care_provided}</p>
                </div>
              )}
              {careLog.catheter_care_provided && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Catheter Care Provided?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.catheter_care_provided}</p>
                </div>
              )}
              {careLog.repositioned_on_visit && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Repositioned on Visit?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.repositioned_on_visit}</p>
                </div>
              )}
              {careLog.skincare_provided && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Skincare Provided?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.skincare_provided}</p>
                </div>
              )}
              {careLog.skin_integrity_concerns && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Skin Integrity Concerns?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.skin_integrity_concerns}</p>
                </div>
              )}
              {careLog.food_offered && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Food Offered?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.food_offered}</p>
                </div>
              )}
              {careLog.drinks_offered && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Drinks Offered?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.drinks_offered}</p>
                </div>
              )}
              {careLog.add_medication_round && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Medication Round Added?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.add_medication_round}</p>
                </div>
              )}
              {careLog.medication_concerns && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Medication Concerns?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.medication_concerns}</p>
                </div>
              )}
              {careLog.further_concerns && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Further Concerns?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.further_concerns}</p>
                </div>
              )}
              {careLog.healthcare_visit_required && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Healthcare Visit Required?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.healthcare_visit_required}</p>
                </div>
              )}
              {careLog.double_handed_call && (
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">Double Handed Call?</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.double_handed_call}</p>
                </div>
              )}
            </div>
          </div>

          {/* Welfare Impression */}
          {careLog.welfare_impression_on_arrival && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
              <p className="text-xs font-semibold text-cyan-900 uppercase mb-2">Welfare Impression on Arrival</p>
              <p className="text-sm text-cyan-900 capitalize">{careLog.welfare_impression_on_arrival.replace(/_/g, ' ')}</p>
            </div>
          )}

          {/* Personal Care Description */}
          {careLog.personal_care_description && (
            <div className="border-l-4 border-pink-400 bg-pink-50 p-4 rounded">
              <p className="text-xs font-semibold text-pink-900 uppercase mb-2">Personal Care Details</p>
              <p className="text-sm text-pink-900 leading-relaxed">{careLog.personal_care_description}</p>
            </div>
          )}

          {/* Catheter Care */}
          {careLog.catheter_care_description && (
            <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded">
              <p className="text-xs font-semibold text-orange-900 uppercase mb-2">Catheter Care Details</p>
              <p className="text-sm text-orange-900 leading-relaxed">{careLog.catheter_care_description}</p>
            </div>
          )}

          {/* Continence Care Monitoring */}
          {careLog.continence_care_monitoring && careLog.continence_care_monitoring.length > 0 && (
            <div className="border-l-4 border-violet-400 bg-violet-50 p-4 rounded">
              <p className="text-xs font-semibold text-violet-900 uppercase mb-2">Continence Care Monitoring</p>
              <ul className="space-y-1">
                {careLog.continence_care_monitoring.map((item, idx) => (
                  <li key={idx} className="text-sm text-violet-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-violet-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Repositioning Details */}
          {careLog.repositioned_description && (
            <div className="border-l-4 border-lime-400 bg-lime-50 p-4 rounded">
              <p className="text-xs font-semibold text-lime-900 uppercase mb-2">Repositioning Details</p>
              <p className="text-sm text-lime-900 leading-relaxed">{careLog.repositioned_description}</p>
            </div>
          )}

          {/* Skincare Details */}
          {careLog.skincare_description && (
            <div className="border-l-4 border-cyan-400 bg-cyan-50 p-4 rounded">
              <p className="text-xs font-semibold text-cyan-900 uppercase mb-2">Skincare Details</p>
              <p className="text-sm text-cyan-900 leading-relaxed">{careLog.skincare_description}</p>
            </div>
          )}

          {/* Skin Integrity Concerns */}
          {careLog.skin_integrity_description && (
            <div className="border-l-4 border-rose-400 bg-rose-50 p-4 rounded">
              <p className="text-xs font-semibold text-rose-900 uppercase mb-2">Skin Integrity Concerns</p>
              <p className="text-sm text-rose-900 leading-relaxed">{careLog.skin_integrity_description}</p>
            </div>
          )}

          {/* Medication Round Outcome */}
          {careLog.medication_round_outcome && (
            <div className="border-l-4 border-fuchsia-400 bg-fuchsia-50 p-4 rounded">
              <p className="text-xs font-semibold text-fuchsia-900 uppercase mb-2">Medication Round Outcome</p>
              <p className="text-sm text-fuchsia-900">{careLog.medication_round_outcome}</p>
            </div>
          )}

          {/* Medication Concerns Details */}
          {careLog.medication_concerns_details && (
            <div className="border-l-4 border-red-400 bg-red-50 p-4 rounded">
              <p className="text-xs font-semibold text-red-900 uppercase mb-2">⚠️ Medication Concerns Details</p>
              <p className="text-sm text-red-900 leading-relaxed">{careLog.medication_concerns_details}</p>
            </div>
          )}

          {/* Healthcare Visit Required */}
          {careLog.healthcare_visit_type && (
            <div className="border-l-4 border-blue-400 bg-blue-50 p-4 rounded">
              <p className="text-xs font-semibold text-blue-900 uppercase mb-2">Healthcare Professional Required</p>
              <p className="text-sm text-blue-900">{careLog.healthcare_visit_type}</p>
            </div>
          )}

          {/* Further Concerns */}
          {careLog.further_concerns_details && (
            <div className="border-l-4 border-orange-400 bg-orange-50 p-4 rounded">
              <p className="text-xs font-semibold text-orange-900 uppercase mb-2">⚠️ Further Concerns</p>
              <p className="text-sm text-orange-900 leading-relaxed">{careLog.further_concerns_details}</p>
            </div>
          )}

          {/* Staff Information */}
          {(careLog.staff_grade || careLog.double_handed_call || careLog.staff_1 || careLog.staff_2) && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg">
              {careLog.staff_grade && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Staff Grade</p>
                  <p className="text-sm font-medium text-slate-900">{careLog.staff_grade}</p>
                </div>
              )}
              {careLog.double_handed_call && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Double Handed Call</p>
                  <p className="text-sm font-medium text-slate-900 capitalize">{careLog.double_handed_call}</p>
                </div>
              )}
              {careLog.staff_1 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Staff Member 1</p>
                  <p className="text-sm font-medium text-slate-900">{getStaffName(careLog.staff_1)}</p>
                </div>
              )}
              {careLog.staff_2 && (
                <div>
                  <p className="text-xs font-semibold text-slate-600 uppercase mb-1">Staff Member 2</p>
                  <p className="text-sm font-medium text-slate-900">{getStaffName(careLog.staff_2)}</p>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {careLog.notes && (
            <div className="border-l-4 border-slate-400 bg-slate-50 p-4 rounded">
              <p className="text-xs font-semibold text-slate-700 uppercase mb-2">Notes</p>
              <p className="text-sm text-slate-700 leading-relaxed">{careLog.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="pt-4 border-t border-slate-200">
            <div className="text-xs text-slate-500 space-y-1">
              {careLog.submitted_at && (
                <p>Submitted: {format(new Date(careLog.submitted_at), 'dd MMM yyyy • HH:mm')}</p>
              )}
              {careLog.created_date && (
                <p>Recorded: {format(new Date(careLog.created_date), 'dd MMM yyyy • HH:mm')}</p>
              )}
              {careLog.timestamp && (
                <p>Log Time: {format(new Date(careLog.timestamp), 'dd MMM yyyy • HH:mm')}</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}