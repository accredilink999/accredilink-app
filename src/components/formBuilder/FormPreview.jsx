import React, { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from 'lucide-react';
import FormFieldRenderer from './FormFieldRenderer';

export default function FormPreview({ form, onBack, isLiveSubmission }) {
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [showCabinetDialog, setShowCabinetDialog] = useState(false);
  const [selectedMainCabinet, setSelectedMainCabinet] = useState('');
  const [selectedSubCabinet, setSelectedSubCabinet] = useState('');
  const [pendingSubmission, setPendingSubmission] = useState(null);
  const queryClient = useQueryClient();
  
  const { data: cabinetStructures = [] } = useQuery({
    queryKey: ['cabinetStructures'],
    queryFn: () => base44.entities.CabinetStructure.list(),
    enabled: isLiveSubmission,
  });

  const getMainCabinets = () => {
    return cabinetStructures.map(c => c.main_cabinet_name);
  };

  const getSubCabinets = (mainCabinetName) => {
    const structure = cabinetStructures.find(c => c.main_cabinet_name === mainCabinetName);
    return structure?.sub_cabinets || [];
  };

  const fields = JSON.parse(form.schema || '[]');

  const submitMutation = useMutation({
    mutationFn: (data) => base44.entities.FormSubmission.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setSubmitted(true);
      setTimeout(() => {
        setFormData({});
        setSubmitted(false);
      }, 3000);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLiveSubmission) {
      setPendingSubmission(formData);
      setShowCabinetDialog(true);
    } else {
      performSubmission(formData, '');
    }
  };

  const performSubmission = (data, cabinetValue) => {
    let mainCabinet = 'Care Logs';
    let subCabinet = 'General';
    
    if (cabinetValue && cabinetValue.includes('|')) {
      const [main, sub] = cabinetValue.split('|');
      mainCabinet = main;
      subCabinet = sub;
    } else if (cabinetValue) {
      mainCabinet = cabinetValue;
      subCabinet = 'General';
    }

    submitMutation.mutate({
      form_id: form.id,
      form_title: form.title,
      submission_data: JSON.stringify(data),
      main_cabinet: mainCabinet,
      cabinet: subCabinet
    });
  };

  const handleCabinetConfirm = () => {
    if (pendingSubmission && selectedMainCabinet) {
      let cabinetValue = selectedMainCabinet;
      if (selectedSubCabinet) {
        cabinetValue = `${selectedMainCabinet}|${selectedSubCabinet}`;
      }
      performSubmission(pendingSubmission, cabinetValue);
      setShowCabinetDialog(false);
      setSelectedMainCabinet('');
      setSelectedSubCabinet('');
      setPendingSubmission(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold text-slate-900">{form.title} - Preview</h1>
      </div>

      <Card className="max-w-2xl mx-auto p-8">
        {submitted ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Thank you!</h2>
            <p className="text-slate-600">Your submission has been received.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {form.description && (
              <p className="text-slate-600 text-sm">{form.description}</p>
            )}
            
            {fields.map(field => (
              <div key={field.id}>
                <FormFieldRenderer
                  field={field}
                  value={formData[field.id]}
                  onChange={(val) => setFormData({ ...formData, [field.id]: val })}
                  preview={false}
                />
              </div>
            ))}

            <Button
              type="submit"
              disabled={submitMutation.isPending}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              {submitMutation.isPending ? 'Submitting...' : 'Submit'}
            </Button>
          </form>
        )}
      </Card>

      {isLiveSubmission && (
        <Dialog open={showCabinetDialog} onOpenChange={setShowCabinetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>File this submission</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Main Cabinet</label>
                <Select value={selectedMainCabinet} onValueChange={(value) => {
                  setSelectedMainCabinet(value);
                  setSelectedSubCabinet('');
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a main cabinet..." />
                  </SelectTrigger>
                  <SelectContent>
                    {getMainCabinets().map(cabinet => (
                      <SelectItem key={cabinet} value={cabinet}>
                        {cabinet}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMainCabinet && (
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Sub Cabinet</label>
                  <Select value={selectedSubCabinet} onValueChange={setSelectedSubCabinet}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a sub cabinet..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getSubCabinets(selectedMainCabinet).map(subCabinet => (
                        <SelectItem key={subCabinet} value={subCabinet}>
                          {subCabinet}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCabinetDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCabinetConfirm}
                disabled={!selectedMainCabinet}
                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50"
              >
                File Submission
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}