import React, { useEffect, useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';
import { Loader2, Archive } from 'lucide-react';

export default function MedicationInfoPopup({ medication, open, onOpenChange, serviceUserId }) {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState('');
  const [showArchivedCharts, setShowArchivedCharts] = useState(false);

  useEffect(() => {
    if (open && medication) {
      fetchMedicationInfo();
    }
  }, [open, medication]);

  const fetchMedicationInfo = async () => {
    setLoading(true);
    setInfo('');
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Provide a brief overview of the medication "${medication.medication_name}" including:
1. What it's used for
2. Common side effects
3. Important cautions or warnings

Format the response clearly with these sections.`,
        add_context_from_internet: true
      });
      setInfo(response);
    } catch (error) {
      setInfo('Error fetching medication information. Please try again.');
      console.error('Error fetching medication info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg">
            {medication?.medication_name}
          </SheetTitle>
          <p className="text-sm text-slate-600 mt-1">
            {medication?.dosage} • {medication?.frequency}
          </p>
        </SheetHeader>

        <div className="mt-6 space-y-4">
           {loading ? (
             <div className="flex items-center justify-center py-8">
               <Loader2 className="w-6 h-6 text-teal-600 animate-spin mr-2" />
               <span className="text-slate-600">Fetching medication information...</span>
             </div>
           ) : (
             <div className="prose prose-sm max-w-none bg-slate-50 p-4 rounded-lg">
               <p className="text-sm text-slate-700 whitespace-pre-wrap">{info}</p>
             </div>
           )}

          <Button
            onClick={() => {
              onOpenChange(false);
              setTimeout(() => setShowArchivedCharts(true), 200);
            }}
            variant="outline"
            className="w-full gap-2"
          >
            <Archive className="w-4 h-4" />
            View Past MAR Charts
          </Button>
        </div>
        </SheetContent>
        </Sheet>
        );
        }