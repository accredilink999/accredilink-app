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
import EmptyState from '@/components/ui/EmptyState';
import { 
  Plus, 
  Upload,
  Search, 
  FileText,
  Download,
  ExternalLink,
  BookOpen,
  FileCheck,
  Folder,
  Trash2
} from 'lucide-react';

const categoryIcons = {
  policy: BookOpen,
  procedure: FileCheck,
  training: FileText,
  form: FileText,
  template: FileText,
  other: Folder
};

const categoryColors = {
  policy: 'bg-blue-100 text-blue-600',
  procedure: 'bg-purple-100 text-purple-600',
  training: 'bg-emerald-100 text-emerald-600',
  form: 'bg-amber-100 text-amber-600',
  template: 'bg-pink-100 text-pink-600',
  other: 'bg-slate-100 text-slate-600'
};

export default function CompanyDocuments({ user, isAdmin }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'other',
    description: '',
    file_url: '',
    is_mandatory_read: false
  });

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['companyDocuments'],
    queryFn: () => base44.entities.Document.list('-created_date'),
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Document.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Document uploaded');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Document.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
      toast.success('Document updated');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Document.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyDocuments'] });
      toast.success('Document deleted');
    },
    onError: (error) => { toast.error('Failed: ' + error.message); },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      category: 'other',
      description: '',
      file_url: '',
      is_mandatory_read: false
    });
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updatedFormData = { ...formData, file_url, file_type: file.type };
      setFormData(updatedFormData);
      
      // Auto-submit if title is filled
      if (updatedFormData.title) {
        createMutation.mutate({
          ...updatedFormData,
          uploaded_by: user?.id,
          uploaded_by_name: user?.full_name,
          read_by: []
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
      uploaded_by: user?.id,
      uploaded_by_name: user?.full_name,
      read_by: []
    });
  };

  const markAsRead = (doc) => {
    if (!doc.read_by?.includes(user?.id)) {
      updateMutation.mutate({
        id: doc.id,
        data: {
          read_by: [...(doc.read_by || []), user.id]
        }
      });
    }
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || doc.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedDocs = filteredDocs.reduce((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="p-4 bg-white border-0 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="policy">Policies</SelectItem>
              <SelectItem value="procedure">Procedures</SelectItem>
              <SelectItem value="training">Training</SelectItem>
              <SelectItem value="form">Forms</SelectItem>
              <SelectItem value="template">Templates</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
          {isAdmin && (
            <Button onClick={() => setIsDialogOpen(true)} className="bg-teal-600 hover:bg-teal-700">
              <Plus className="w-4 h-4 mr-2" />
              Upload
            </Button>
          )}
        </div>
      </Card>

      {/* Documents */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="p-4 h-32 animate-pulse bg-slate-100" />
          ))}
        </div>
      ) : Object.keys(groupedDocs).length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No documents found"
          description="Company documents will appear here."
        />
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDocs).map(([category, docs]) => {
            const Icon = categoryIcons[category] || Folder;
            return (
              <div key={category}>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2 capitalize">
                  <Icon className="w-5 h-5 text-slate-500" />
                  {category === 'other' ? 'Other Documents' : `${category}s`}
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {docs.map((doc) => {
                    const DocIcon = categoryIcons[doc.category] || Folder;
                    const isRead = doc.read_by?.includes(user?.id);
                    
                    return (
                      <Card 
                        key={doc.id}
                        className={`p-4 bg-white border-0 shadow-sm hover:shadow-md transition-all ${
                          doc.is_mandatory_read && !isRead ? 'ring-2 ring-amber-300' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4 mb-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${categoryColors[doc.category]}`}>
                            <DocIcon className="w-6 h-6" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-slate-900 truncate">{doc.title}</h3>
                            {doc.description && (
                              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{doc.description}</p>
                            )}
                            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                              <span>{format(new Date(doc.created_date), 'dd MMM yyyy')}</span>
                              {doc.is_mandatory_read && (
                                <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">
                                  Required
                                </span>
                              )}
                            </div>
                          </div>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteMutation.mutate(doc.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {doc.file_url && (
                            <a
                              href={doc.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => markAsRead(doc)}
                              className="flex-1"
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            </a>
                          )}
                          {doc.file_url && (
                            <a href={doc.file_url} download>
                              <Button variant="ghost" size="icon">
                                <Download className="w-4 h-4 text-slate-500" />
                              </Button>
                            </a>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Company Document</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <Label>Category</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData({...formData, category: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="policy">Policy</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="training">Training Material</SelectItem>
                  <SelectItem value="form">Form</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div>
              <Label>File</Label>
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

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={formData.is_mandatory_read}
                onChange={(e) => setFormData({...formData, is_mandatory_read: e.target.checked})}
                className="rounded"
              />
              <Label>Mark as mandatory reading</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || createMutation.isPending}
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