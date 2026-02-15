import React, { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Upload, Download, Trash2, FileText, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SharedFilesManager() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'other',
    file: null
  });
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: sharedFiles = [], isLoading } = useQuery({
    queryKey: ['sharedFiles'],
    queryFn: () => base44.entities.SharedFile.list('-created_date'),
    enabled: !!user,
  });

  const isAdmin = user?.role === 'admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const uploadFileMutation = useMutation({
    mutationFn: async ({ file, title, description, category }) => {
      setUploading(true);
      setUploadProgress(30);

      // Upload file
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setUploadProgress(70);

      // Create record
      const fileData = {
        title,
        description,
        file_url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        category,
        uploaded_by: user.id,
        uploaded_by_name: user.staff_full_name || user.full_name
      };

      setUploadProgress(90);
      return base44.entities.SharedFile.create(fileData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedFiles'] });
      toast.success('File uploaded successfully');
      setShowUploadDialog(false);
      setFormData({ title: '', description: '', category: 'other', file: null });
      setUploading(false);
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error('Upload failed: ' + error.message);
      setUploading(false);
      setUploadProgress(0);
    },
  });

  const deleteFileMutation = useMutation({
    mutationFn: (fileId) => base44.entities.SharedFile.delete(fileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sharedFiles'] });
      toast.success('File deleted');
    },
  });

  const handleUpload = () => {
    if (!formData.title || !formData.file) {
      toast.error('Please provide a title and select a file');
      return;
    }
    uploadFileMutation.mutate(formData);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleDownload = (file) => {
    window.open(file.file_url, '_blank');
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white border-0 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Shared Files</h3>
          <p className="text-sm text-slate-500">Large files accessible to all users</p>
        </div>
        {isAdmin && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button className="bg-teal-600 hover:bg-teal-700 gap-2">
                <Plus className="w-4 h-4" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Upload Shared File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Company Handbook 2026"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    className="mt-1"
                    rows={3}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="app">App/Software</SelectItem>
                      <SelectItem value="document">Document</SelectItem>
                      <SelectItem value="training">Training Material</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>File *</Label>
                  <Input
                    type="file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setFormData({ ...formData, file });
                      }
                    }}
                    className="mt-1"
                    accept="*/*"
                  />
                  {formData.file && (
                    <p className="text-xs text-slate-500 mt-1">
                      {formData.file.name} ({formatFileSize(formData.file.size)})
                    </p>
                  )}
                </div>
                {uploading && (
                  <div className="space-y-2">
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 text-center">Uploading... {uploadProgress}%</p>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                    disabled={uploading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || !formData.title || !formData.file}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 gap-2"
                  >
                    {uploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {sharedFiles.length === 0 ? (
        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-lg">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-sm text-slate-600">No shared files yet</p>
          {isAdmin && <p className="text-xs text-slate-500 mt-1">Upload files to share with all users</p>}
        </div>
      ) : (
        <div className="space-y-3">
          {sharedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium text-slate-900 truncate">{file.title}</h4>
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded capitalize flex-shrink-0">
                    {file.category}
                  </span>
                </div>
                {file.description && (
                  <p className="text-sm text-slate-600 mb-1 line-clamp-1">{file.description}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{file.file_name}</span>
                  <span>•</span>
                  <span>{formatFileSize(file.file_size)}</span>
                  <span>•</span>
                  <span>By {file.uploaded_by_name}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDownload(file)}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                {isAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Delete this file?')) {
                        deleteFileMutation.mutate(file.id);
                      }
                    }}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}