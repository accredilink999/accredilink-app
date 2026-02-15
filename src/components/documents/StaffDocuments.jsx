import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import EmptyState from '@/components/ui/EmptyState';
import { 
  Plus, 
  Upload,
  FileText,
  Download,
  ExternalLink,
  AlertCircle,
  FileCheck,
  Trash2,
  Calendar
} from 'lucide-react';

const documentTypeLabels = {
  contract: 'Employment Contract',
  id_proof: 'ID Proof',
  certification: 'Certification',
  right_to_work: 'Right to Work',
  dbs_check: 'DBS Check',
  reference: 'Reference',
  proof_of_address: 'Proof of Address',
  qualification: 'Qualification',
  insurance: 'Insurance',
  drivers_license: "Driver's License",
  medical_clearance: 'Medical Clearance',
  other: 'Other'
};

export default function StaffDocuments({ user }) {
   const isAdmin = user?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);
   const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    document_type: 'other',
    title: '',
    description: '',
    file_url: '',
    issue_date: '',
    expiry_date: ''
  });

  const { data: myDocuments = [], isLoading } = useQuery({
    queryKey: ['myDocuments', user?.id],
    queryFn: () => base44.entities.HRDocument.filter({ staff_id: user?.id }, '-created_date'),
    enabled: !!user?.id,
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['documentRequirements'],
    queryFn: () => base44.entities.DocumentRequirement.filter({ is_active: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Document uploaded');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HRDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myDocuments'] });
      toast.success('Document deleted');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const resetForm = () => {
    setFormData({
      document_type: 'other',
      title: '',
      description: '',
      file_url: '',
      issue_date: '',
      expiry_date: ''
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updatedFormData = { ...formData, file_url };
      setFormData(updatedFormData);
      
      // Auto-submit if title is filled
      if (updatedFormData.title) {
        createMutation.mutate({
          ...updatedFormData,
          staff_id: user?.id,
          staff_name: user?.gps_map_name || user?.full_name,
          uploaded_by: user?.id,
          uploaded_by_name: user?.full_name,
          viewable_by_staff: true,
          is_confidential: false
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    createMutation.mutate({
      ...formData,
      staff_id: user?.id,
      staff_name: user?.gps_map_name || user?.full_name,
      uploaded_by: user?.id,
      uploaded_by_name: user?.full_name,
      viewable_by_staff: true,
      is_confidential: false
    });
  };

  // Check which requirements are missing
  const uploadedTypes = myDocuments.map(d => d.document_type);
  const missingRequirements = requirements.filter(req => 
    req.is_mandatory && !uploadedTypes.includes(req.document_type)
  );

  // Check for expiring documents
  const expiringDocs = myDocuments.filter(doc => {
    if (!doc.expiry_date) return false;
    const daysUntilExpiry = Math.floor((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry > 0 && daysUntilExpiry <= 30;
  });

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {missingRequirements.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">Missing Required Documents</h3>
              <p className="text-sm text-amber-700 mt-1">
                Please upload the following required documents:
              </p>
              <ul className="mt-2 space-y-1">
                {missingRequirements.map(req => (
                  <li key={req.id} className="text-sm text-amber-700">
                    • {req.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {expiringDocs.length > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900">Expiring Documents</h3>
              <p className="text-sm text-blue-700 mt-1">
                The following documents will expire soon:
              </p>
              <ul className="mt-2 space-y-1">
                {expiringDocs.map(doc => (
                  <li key={doc.id} className="text-sm text-blue-700">
                    • {doc.title} - Expires {format(new Date(doc.expiry_date), 'dd MMM yyyy')}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Upload Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Documents List */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-4 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : myDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents uploaded"
          description="Upload your employment documents to keep your profile complete."
        />
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {myDocuments.map((doc) => {
            const isExpiringSoon = doc.expiry_date && 
              Math.floor((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
            
            return (
              <Card key={doc.id} className="p-4 bg-white hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-teal-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-slate-900">{doc.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {documentTypeLabels[doc.document_type] || doc.document_type}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {doc.description && (
                  <p className="text-sm text-slate-600 mb-3">{doc.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-3">
                  {doc.issue_date && (
                    <Badge variant="outline" className="text-xs">
                      Issued: {format(new Date(doc.issue_date), 'dd/MM/yyyy')}
                    </Badge>
                  )}
                  {doc.expiry_date && (
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${isExpiringSoon ? 'bg-amber-50 text-amber-700 border-amber-300' : ''}`}
                    >
                      Expires: {format(new Date(doc.expiry_date), 'dd/MM/yyyy')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={doc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View
                    </Button>
                  </a>
                  <a href={doc.file_url} download>
                    <Button variant="ghost" size="icon">
                      <Download className="w-4 h-4 text-slate-500" />
                    </Button>
                  </a>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Document Type *</Label>
              <Select 
                value={formData.document_type} 
                onValueChange={(value) => setFormData({...formData, document_type: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(documentTypeLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="e.g., Passport, Certificate..."
              />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Additional details..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({...formData, issue_date: e.target.value})}
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <Label>File *</Label>
              <div className="mt-2">
                {formData.file_url ? (
                  <div className="p-3 bg-emerald-50 rounded-lg text-emerald-700 text-sm flex items-center gap-2">
                    <FileCheck className="w-4 h-4" />
                    File uploaded successfully
                  </div>
                ) : (
                  <label className="block">
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-teal-400 transition-colors">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-500">
                        {uploading ? 'Uploading...' : 'Click to upload file'}
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.file_url || createMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {createMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}