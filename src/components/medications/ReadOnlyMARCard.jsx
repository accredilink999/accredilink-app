import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Pill } from 'lucide-react';
import { format } from 'date-fns';
import MedicationInfoPopup from './MedicationInfoPopup';

export default function ReadOnlyMARCard({ serviceUser }) {
  const [selectedMed, setSelectedMed] = useState(null);
  const [showPopup, setShowPopup] = useState(false);

  if (!serviceUser?.id) return null;

  const { data: medications = [] } = useQuery({
    queryKey: ['medications', serviceUser.id],
    queryFn: () => base44.entities.MedicationRecord.filter({ service_user_id: serviceUser.id }),
    enabled: !!serviceUser.id,
  });

  if (medications.length === 0) {
    return null;
  }

  return (
    <>
      <Card className="p-3 sm:p-4">
        <h4 className="font-semibold mb-3 text-teal-600 text-sm sm:text-base">Current Medications</h4>
        <div className="w-full">
          <table className="w-full text-[11px] sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-slate-200 px-1.5 py-1 sm:p-2 text-left font-semibold text-slate-900">Medication</th>
                <th className="border border-slate-200 px-1.5 py-1 sm:p-2 text-left font-semibold text-slate-900">Dosage</th>
                <th className="border border-slate-200 px-1.5 py-1 sm:p-2 text-left font-semibold text-slate-900">Frequency</th>
                <th className="border border-slate-200 px-1.5 py-1 sm:p-2 text-left font-semibold text-slate-900">Route</th>
              </tr>
            </thead>
            <tbody>
              {medications.map(med => (
                <tr 
                  key={med.id} 
                  className="hover:bg-slate-50 cursor-pointer"
                  onClick={() => {
                    setSelectedMed(med);
                    setShowPopup(true);
                  }}
                >
                  <td className="border border-slate-200 px-1.5 py-1 sm:p-2">
                    <div className="flex items-center gap-1">
                      <Pill className="w-3 h-3 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-slate-900 hover:text-teal-600 break-words">{med.medication_name}</span>
                    </div>
                  </td>
                  <td className="border border-slate-200 px-1.5 py-1 sm:p-2 text-slate-700 break-words">{med.dosage}</td>
                  <td className="border border-slate-200 px-1.5 py-1 sm:p-2 text-slate-700 break-words">{med.frequency}</td>
                  <td className="border border-slate-200 px-1.5 py-1 sm:p-2 text-slate-700 break-words">{med.route || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {selectedMed && (
        <MedicationInfoPopup 
          medication={selectedMed} 
          open={showPopup} 
          onOpenChange={setShowPopup}
        />
      )}
    </>
  );
}