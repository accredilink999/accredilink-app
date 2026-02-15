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
  Search,
  FileText,
  Download,
  ExternalLink,
  Users,
  FileCheck,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff
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

export default function AdminDocuments({ user }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    staff_id: '',
    document_type: 'other',
    title: '',
    description: '',
    file_url: '',
    issue_date: '',
    expiry_date: '',
    viewable_by_staff: true
  });

  const { data: allDocuments = [], isLoading } = useQuery({
    queryKey: ['allHRDocuments'],
    queryFn: () => base44.entities.HRDocument.list('-created_date'),
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['allUsers'],
    queryFn: () => base44.entities.User.list(),
  });

  const { data: requirements = [] } = useQuery({
    queryKey: ['documentRequirements'],
    queryFn: () => base44.entities.DocumentRequirement.filter({ is_active: true }),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.HRDocument.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHRDocuments'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Document uploaded');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.HRDocument.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHRDocuments'] });
      toast.success('Document deleted');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ id, viewable }) =>
      base44.entities.HRDocument.update(id, { viewable_by_staff: viewable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allHRDocuments'] });
      toast.success('Visibility updated');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const resetForm = () => {
    setFormData({
      staff_id: '',
      document_type: 'other',
      title: '',
      description: '',
      file_url: '',
      issue_date: '',
      expiry_date: '',
      viewable_by_staff: true
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
      
      // Auto-submit if required fields are filled
      if (updatedFormData.staff_id && updatedFormData.title) {
        const selectedStaffMember = staff.find(s => s.id === updatedFormData.staff_id);
        createMutation.mutate({
          ...updatedFormData,
          staff_name: selectedStaffMember?.gps_map_name || selectedStaffMember?.full_name,
          uploaded_by: user?.id,
          uploaded_by_name: user?.full_name,
          is_confidential: !updatedFormData.viewable_by_staff
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
  };

  const handleSubmit = () => {
    const selectedStaffMember = staff.find(s => s.id === formData.staff_id);
    createMutation.mutate({
      ...formData,
      staff_name: selectedStaffMember?.gps_map_name || selectedStaffMember?.full_name,
      uploaded_by: user?.id,
      uploaded_by_name: user?.full_name,
      is_confidential: !formData.viewable_by_staff
    });
  };

  // Filter documents
  const filteredDocs = allDocuments.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.staff_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStaff = selectedStaff === 'all' || doc.staff_id === selectedStaff;
    return matchesSearch && matchesStaff;
  });

  // Group by staff
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.staff_id]) {
      acc[doc.staff_id] = {
        staff_name: doc.staff_name,
        documents: []
      };
    }
    acc[doc.staff_id].documents.push(doc);
    return acc;
  }, {});

  // Calculate compliance
  const staffCompliance = staff.map(staffMember => {
    const staffDocs = allDocuments.filter(d => d.staff_id === staffMember.id);
    const uploadedTypes = staffDocs.map(d => d.document_type);
    const mandatoryReqs = requirements.filter(r => r.is_mandatory);
    const missing = mandatoryReqs.filter(req => !uploadedTypes.includes(req.document_type));
    
    return {
      staff: staffMember,
      total: mandatoryReqs.length,
      uploaded: mandatoryReqs.length - missing.length,
      missing: missing.length
    };
  });

  const nonCompliantStaff = staffCompliance.filter(s => s.missing > 0);

  return (
    <div className="space-y-6">
      {/* Compliance Alert */}
      {nonCompliantStaff.length > 0 && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-900">
                {nonCompliantStaff.length} Staff Member{nonCompliantStaff.length !== 1 ? 's' : ''} Missing Documents
              </h3>
              <div className="mt-2 space-y-1">
                {nonCompliantStaff.slice(0, 5).map(s => (
                  <p key={s.staff.id} className="text-sm text-amber-700">
                    • {s.staff.gps_map_name || s.staff.full_name} - {s.missing} document{s.missing !== 1 ? 's' : ''} missing
                  </p>
                ))}
                {nonCompliantStaff.length > 5 && (
                  <p className="text-sm text-amber-700">
                    ...and {nonCompliantStaff.length - 5} more
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search staff or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedStaff} onValueChange={setSelectedStaff}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="All Staff" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              {staff.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.gps_map_name || s.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
            <Plus className="w-4 h-4 mr-2" />
            Upload for Staff
          </Button>
        </div>
      </Card>

      {/* Documents */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-4 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : Object.keys(groupedDocs).length === 0 ? (
        <EmptyState
          icon={Users}
          title="No documents found"
          description="Upload documents for your staff members."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedDocs).map(([staffId, { staff_name, documents }]) => (
            <Card key={staffId} className="p-6 bg-white">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-600" />
                {staff_name}
                <Badge variant="outline" className="ml-2">
                  {documents.length} document{documents.length !== 1 ? 's' : ''}
                </Badge>
              </h3>
              
              <div className="grid md:grid-cols-2 gap-4">
                {documents.map((doc) => {
                  const isExpiringSoon = doc.expiry_date && 
                    Math.floor((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
                  
                  return (
                    <Card key={doc.id} className="p-4 bg-slate-50 hover:bg-white transition-colors">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-teal-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {documentTypeLabels[doc.document_type] || doc.document_type}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleVisibilityMutation.mutate({
                              id: doc.id,
                              viewable: !doc.viewable_by_staff
                            })}
                            className="text-slate-500 hover:text-teal-600"
                          >
                            {doc.viewable_by_staff ? 
                              <Eye className="w-4 h-4" /> : 
                              <EyeOff className="w-4 h-4" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {doc.description && (
                        <p className="text-sm text-slate-600 mb-3">{doc.description}</p>
                      )}

                      <div className="flex flex-wrap gap-2 mb-3">
                        {!doc.viewable_by_staff && (
                          <Badge variant="outline" className="text-xs bg-slate-100">
                            Hidden from staff
                          </Badge>
                        )}
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
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document for Staff</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Staff Member *</Label>
              <Select 
                value={formData.staff_id} 
                onValueChange={(value) => setFormData({...formData, staff_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.gps_map_name || s.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
                placeholder="e.g., Employment Contract 2026"
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.viewable_by_staff}
                onChange={(e) => setFormData({...formData, viewable_by_staff: e.target.checked})}
                className="rounded"
              />
              <Label>Allow staff member to view this document</Label>
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
              disabled={!formData.staff_id || !formData.title || !formData.file_url || createMutation.isPending}
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