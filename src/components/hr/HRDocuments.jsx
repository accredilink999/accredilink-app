import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FileText, Download, Upload, Plus, AlertCircle } from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';

export default function HRDocuments({ userId, isAdmin }) {
  const queryClient = useQueryClient();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    staff_id: '',
    document_type: 'contract',
    title: '',
    description: '',
    issue_date: '',
    expiry_date: '',
    viewable_by_staff: false
  });
  const [file, setFile] = useState(null);

  const { data: documents = [] } = useQuery({
    queryKey: ['hr-documents', userId, isAdmin],
    queryFn: async () => {
      if (isAdmin) {
        return base44.entities.HRDocument.list('-created_date', 200);
      }
      const docs = await base44.entities.HRDocument.filter({ staff_id: userId });
      return docs.filter(doc => doc.viewable_by_staff);
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ['staff'],
    queryFn: () => base44.entities.User.list(),
    enabled: isAdmin,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const uploadMutation = useMutation({
    mutationFn: async (data) => {
      const uploadResult = await base44.integrations.Core.UploadFile({ file: data.file });
      const staffMember = staff.find(s => s.id === data.staff_id);
      
      return base44.entities.HRDocument.create({
        staff_id: data.staff_id,
        staff_name: staffMember?.full_name,
        document_type: data.document_type,
        title: data.title,
        description: data.description,
        file_url: uploadResult.file_url,
        issue_date: data.issue_date,
        expiry_date: data.expiry_date,
        viewable_by_staff: data.viewable_by_staff,
        uploaded_by: currentUser?.id,
        uploaded_by_name: currentUser?.full_name
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr-documents'] });
      setIsUploadModalOpen(false);
      setFile(null);
      setUploadData({
        staff_id: '',
        document_type: 'contract',
        title: '',
        description: '',
        issue_date: '',
        expiry_date: '',
        viewable_by_staff: false
      });
    },
  });

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = addDays(now, 30);

    if (isBefore(expiry, now)) {
      return { label: 'Expired', color: 'bg-red-100 text-red-800' };
    } else if (isBefore(expiry, thirtyDaysFromNow)) {
      return { label: 'Expiring Soon', color: 'bg-yellow-100 text-yellow-800' };
    }
    return { label: 'Valid', color: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-4">
      {isAdmin && (
        <Button onClick={() => setIsUploadModalOpen(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      )}

      <div className="space-y-3">
        {documents.map((doc) => {
          const expiryStatus = getExpiryStatus(doc.expiry_date);
          return (
            <Card key={doc.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-900">{doc.title}</h4>
                    {isAdmin && <p className="text-sm text-slate-600">{doc.staff_name}</p>}
                    <p className="text-sm text-slate-500 capitalize">{doc.document_type.replace(/_/g, ' ')}</p>
                    {doc.description && <p className="text-sm text-slate-600 mt-1">{doc.description}</p>}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {doc.issue_date && (
                        <Badge variant="outline" className="text-xs">
                          Issued: {format(parseISO(doc.issue_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                      {doc.expiry_date && expiryStatus && (
                        <Badge className={`${expiryStatus.color} text-xs`}>
                          {expiryStatus.label} - {format(parseISO(doc.expiry_date), 'MMM d, yyyy')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => window.open(doc.file_url, '_blank')}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          );
        })}
      </div>

      {documents.length === 0 && (
        <Card className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No documents available</p>
        </Card>
      )}

      <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload HR Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Staff Member</Label>
              <Select value={uploadData.staff_id} onValueChange={(value) => setUploadData({...uploadData, staff_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={uploadData.document_type} onValueChange={(value) => setUploadData({...uploadData, document_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="id_proof">ID Proof</SelectItem>
                  <SelectItem value="certification">Certification</SelectItem>
                  <SelectItem value="right_to_work">Right to Work</SelectItem>
                  <SelectItem value="dbs_check">DBS Check</SelectItem>
                  <SelectItem value="reference">Reference</SelectItem>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={uploadData.title} onChange={(e) => setUploadData({...uploadData, title: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input type="date" value={uploadData.issue_date} onChange={(e) => setUploadData({...uploadData, issue_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Expiry Date</Label>
                <Input type="date" value={uploadData.expiry_date} onChange={(e) => setUploadData({...uploadData, expiry_date: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={uploadData.viewable_by_staff}
                onCheckedChange={(checked) => setUploadData({...uploadData, viewable_by_staff: checked})}
              />
              <Label>Staff can view this document</Label>
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <Input type="file" onChange={(e) => setFile(e.target.files[0])} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => uploadMutation.mutate({ ...uploadData, file })}
              disabled={!file || !uploadData.staff_id || !uploadData.title || uploadMutation.isPending}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}