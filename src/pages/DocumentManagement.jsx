import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import FormSubmissionsCabinet from '@/components/formBuilder/FormSubmissionsCabinet';
import SubmissionViewer from '@/components/formBuilder/SubmissionViewer';
import CompanyLogoUploader from '@/components/CompanyLogoUploader';
import { Zap, FolderPlus, Archive } from 'lucide-react';
import { archiveItem } from '@/utils/archiveHelper';

export default function DocumentManagement() {
  const queryClient = useQueryClient();
  const cabinetRef = useRef(null);
  const [viewingSubmission, setViewingSubmission] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDeleteSubmission, setPendingDeleteSubmission] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: submissions = [] } = useQuery({
    queryKey: ['formSubmissions'],
    queryFn: () => base44.entities.FormSubmission.list(),
  });

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list(),
  });

  const deleteSubmissionMutation = useMutation({
    mutationFn: async (submission) => {
      await archiveItem({
        entityType: 'form_submission',
        entityId: submission.id || submission,
        itemName: submission.submitter_email || submission.form_id || 'Form Submission',
        itemData: typeof submission === 'object' ? submission : { id: submission },
      });
      const id = typeof submission === 'object' ? submission.id : submission;
      await base44.entities.FormSubmission.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
    },
  });

  const handleViewSubmission = (submission) => {
    const form = forms.find(f => f.id === submission.form_id);
    if (form) {
      setViewingSubmission({ submission, form });
    }
  };

  const handleDeleteSubmission = (submission) => {
    setPendingDeleteSubmission(submission);
    setConfirmOpen(true);
  };

  const handleMoveSubmission = (submission, targetCabinet) => {
    base44.entities.FormSubmission.update(submission.id, { cabinet: targetCabinet });
    queryClient.invalidateQueries({ queryKey: ['formSubmissions'] });
  };

  const handleCreateCabinet = () => {
    cabinetRef.current?.createNewCabinet();
  };

  if (viewingSubmission) {
    return (
      <SubmissionViewer
        submission={viewingSubmission.submission}
        form={viewingSubmission.form}
        onBack={() => setViewingSubmission(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Document Management" 
        subtitle="Manage documents, policies, and administration tools"
        icon={Archive}
      >
        <div className="flex gap-2">
          <Button 
            onClick={handleCreateCabinet}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <FolderPlus className="w-4 h-4 mr-2" />
            New Filing Cabinet
          </Button>
          <Link to={createPageUrl('FormBuilder')}>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Zap className="w-4 h-4 mr-2" />
              Form Deployer
            </Button>
          </Link>
        </div>
      </PageHeader>

      <CompanyLogoUploader />

      <div className="text-center py-6">
        <h3 className="text-2xl font-bold text-slate-900">Filing Cabinets</h3>
      </div>

      <FormSubmissionsCabinet
        ref={cabinetRef}
        submissions={submissions}
        forms={forms}
        onView={handleViewSubmission}
        onDelete={handleDeleteSubmission}
        onMove={handleMoveSubmission}
        onUpdateCabinet={(id, cabinet) => base44.entities.FormSubmission.update(id, { cabinet })}
        currentUser={user}
      />

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete submission?"
        description={`Delete this submission from ${pendingDeleteSubmission?.submitter_email || 'this user'}?`}
        confirmLabel="Yes, Delete"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteSubmission) {
            deleteSubmissionMutation.mutate(pendingDeleteSubmission);
            setPendingDeleteSubmission(null);
          }
        }}
      />
    </div>
  );
}