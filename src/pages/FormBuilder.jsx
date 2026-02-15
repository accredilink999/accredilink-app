import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, ArrowLeft, Eye, Code, Trash2, Copy, WandSparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import FormBuilderEditor from '@/components/formBuilder/FormBuilderEditor';
import FormPreview from '@/components/formBuilder/FormPreview';
import FormsCabinet from '@/components/formBuilder/FormsCabinet';

export default function FormBuilder() {
  const [view, setView] = useState('list'); // list, edit, preview, submission
  const [editingForm, setEditingForm] = useState(null);
  const [submissionForm, setSubmissionForm] = useState(null);
  const [newFormDialog, setNewFormDialog] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [previewId, setPreviewId] = useState(null);
  const [subCabinets, setSubCabinets] = useState([]);
  const queryClient = useQueryClient();

  const { data: forms = [] } = useQuery({
    queryKey: ['forms'],
    queryFn: () => base44.entities.Form.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Form.create(data),
    onSuccess: (newForm) => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
      setEditingForm(newForm);
      setView('edit');
      setNewFormDialog(false);
      setFormTitle('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Form.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['forms'] });
    },
  });

  const handleCreateForm = () => {
    if (formTitle.trim()) {
      createMutation.mutate({
        title: formTitle,
        schema: JSON.stringify([]),
        form_url: `form-${Date.now()}`
      });
    }
  };

  const handleEditForm = (form) => {
    setEditingForm(form);
    setView('edit');
  };

  const handlePreviewForm = (form) => {
    setPreviewId(form.id);
    setView('preview');
  };

  const handleDeleteForm = (form) => {
    if (window.confirm(`Delete "${form.title}"?`)) {
      deleteMutation.mutate(form.id);
    }
  };

  const handleLiveSubmission = (form) => {
    setSubmissionForm(form);
    setView('submission');
  };

  return (
    <div className="space-y-6">
      {view === 'list' && (
        <>
          <PageHeader 
            title="Form Builder"
            subtitle="Create and manage forms"
            icon={WandSparkles}
          />

          <div className="flex justify-end">
            <Button 
              onClick={() => setNewFormDialog(true)} 
              className="bg-teal-600 hover:bg-teal-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Form
            </Button>
          </div>

          <FormsCabinet
             forms={forms}
             onEdit={handleEditForm}
             onPreview={handlePreviewForm}
             onDelete={handleDeleteForm}
             onSubmit={handleLiveSubmission}
             onSubCabinetsChange={setSubCabinets}
           />

          <Dialog open={newFormDialog} onOpenChange={setNewFormDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Form</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Form title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateForm()}
                />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setNewFormDialog(false)}>Cancel</Button>
                <Button 
                  onClick={handleCreateForm}
                  disabled={!formTitle.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}

      {view === 'edit' && editingForm && (
        <FormBuilderEditor 
          form={editingForm}
          subCabinets={subCabinets}
          onBack={() => {
            setView('list');
            setEditingForm(null);
            queryClient.invalidateQueries({ queryKey: ['forms'] });
          }}
        />
      )}

      {view === 'preview' && previewId && (
        <FormPreview
          form={forms.find(f => f.id === previewId)}
          onBack={() => {
            setView('list');
            setPreviewId(null);
          }}
        />
      )}

      {view === 'submission' && submissionForm && (
        <FormPreview
          form={submissionForm}
          isLiveSubmission={true}
          onBack={() => {
            setView('list');
            setSubmissionForm(null);
          }}
        />
      )}
    </div>
  );
}