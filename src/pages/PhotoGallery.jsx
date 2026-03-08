import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/api/supabaseClient';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ImagePlus, Trash2, Download, Search, FolderPlus, Folder, ChevronLeft,
  Loader2, Eye, X, ZoomIn, ZoomOut, RotateCw, Grid3x3, List
} from 'lucide-react';
import { toast } from 'sonner';
import { getCurrentOrgId } from '@/lib/orgContext';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function PhotoGallery() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [viewImage, setViewImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  // Fetch all photos
  const { data: photos = [], isLoading } = useQuery({
    queryKey: ['org_photos'],
    queryFn: async () => {
      const orgId = getCurrentOrgId();
      let q = supabase.from('org_photos').select('*');
      if (orgId) q = q.eq('organization_id', orgId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  // Get unique folders
  const folders = [...new Set(photos.map(p => p.folder).filter(Boolean))].sort();

  // Filter photos
  const filtered = photos.filter(p => {
    if (selectedFolder && p.folder !== selectedFolder) return false;
    if (search) {
      const q = search.toLowerCase();
      return (p.file_name || '').toLowerCase().includes(q) ||
             (p.description || '').toLowerCase().includes(q) ||
             (p.folder || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Upload photos
  const handleUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setUploading(true);
    let successCount = 0;

    for (const file of files) {
      try {
        // Upload to Supabase storage
        const ext = file.name.split('.').pop();
        const path = `org-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('uploads')
          .upload(path, file, { contentType: file.type });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from('uploads').getPublicUrl(path);

        // Save record
        const { error: insertErr } = await supabase.from('org_photos').insert({
          organization_id: getCurrentOrgId(),
          file_name: file.name,
          file_url: urlData.publicUrl,
          file_size: file.size,
          mime_type: file.type,
          folder: selectedFolder || null,
          storage_path: path,
        });

        if (insertErr) throw insertErr;
        successCount++;
      } catch (err) {
        console.error('Upload error:', err);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} photo${successCount > 1 ? 's' : ''} uploaded`);
      queryClient.invalidateQueries({ queryKey: ['org_photos'] });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Create folder
  const handleCreateFolder = () => {
    if (!newFolderName.trim()) return;
    setSelectedFolder(newFolderName.trim());
    setShowNewFolder(false);
    setNewFolderName('');
    toast.success(`Folder "${newFolderName.trim()}" created`);
  };

  // Delete photo
  const deleteMutation = useMutation({
    mutationFn: async (photo) => {
      // Delete from storage
      if (photo.storage_path) {
        await supabase.storage.from('uploads').remove([photo.storage_path]);
      }
      // Delete record
      const { error } = await supabase.from('org_photos').delete().eq('id', photo.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Photo deleted');
      queryClient.invalidateQueries({ queryKey: ['org_photos'] });
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete photo'),
  });

  // Download photo
  const handleDownload = async (photo) => {
    try {
      const response = await fetch(photo.file_url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = photo.file_name || 'photo';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <PageHeader title="Photo Gallery" subtitle="Organisation photos and images" />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search photos..."
            className="pl-9"
          />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-teal-600 hover:bg-teal-700"
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImagePlus className="w-4 h-4 mr-2" />}
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>

        <Button variant="outline" size="icon" onClick={() => setShowNewFolder(true)}>
          <FolderPlus className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
        </Button>
      </div>

      {/* New folder dialog */}
      {showNewFolder && (
        <Card className="p-4 mb-4 border-teal-200 bg-teal-50">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-teal-600" />
            <Label className="text-sm font-medium text-teal-800">New Folder</Label>
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="flex-1"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            />
            <Button size="sm" onClick={handleCreateFolder}>Create</Button>
            <Button size="sm" variant="outline" onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}>Cancel</Button>
          </div>
        </Card>
      )}

      {/* Folder chips */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {selectedFolder && (
          <button
            onClick={() => setSelectedFolder(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-600 hover:bg-slate-200"
          >
            <ChevronLeft className="w-3 h-3" />
            All Photos
          </button>
        )}
        {!selectedFolder && folders.map(f => (
          <button
            key={f}
            onClick={() => setSelectedFolder(f)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border rounded-full text-sm text-slate-700 hover:bg-slate-50"
          >
            <Folder className="w-3 h-3 text-amber-500" />
            {f}
            <span className="text-xs text-slate-400">({photos.filter(p => p.folder === f).length})</span>
          </button>
        ))}
        {selectedFolder && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 border border-teal-200 rounded-full text-sm font-medium text-teal-700">
            <Folder className="w-3 h-3" />
            {selectedFolder}
          </span>
        )}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filtered.length === 0 && (
        <Card className="p-12 text-center">
          <ImagePlus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No photos yet</p>
          <p className="text-sm text-slate-400 mt-1">Upload images to get started</p>
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="mt-4 bg-teal-600 hover:bg-teal-700"
          >
            <ImagePlus className="w-4 h-4 mr-2" />
            Upload Photos
          </Button>
        </Card>
      )}

      {/* Grid view */}
      {!isLoading && filtered.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(photo => (
            <div
              key={photo.id}
              className="group relative bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="aspect-square bg-slate-100 cursor-pointer"
                onClick={() => { setViewImage(photo); setZoom(1); setRotation(0); }}
              >
                <img
                  src={photo.file_url}
                  alt={photo.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-slate-700 truncate">{photo.file_name}</p>
                <p className="text-[10px] text-slate-400">{formatSize(photo.file_size)}</p>
                {photo.folder && (
                  <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                    <Folder className="w-2.5 h-2.5" /> {photo.folder}
                  </p>
                )}
              </div>
              {/* Hover actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); setViewImage(photo); setZoom(1); setRotation(0); }}
                  className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDownload(photo); }}
                  className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteTarget(photo); }}
                  className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!isLoading && filtered.length > 0 && viewMode === 'list' && (
        <div className="space-y-2">
          {filtered.map(photo => (
            <Card key={photo.id} className="p-3 flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 cursor-pointer"
                onClick={() => { setViewImage(photo); setZoom(1); setRotation(0); }}
              >
                <img src={photo.file_url} alt={photo.file_name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{photo.file_name}</p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>{formatSize(photo.file_size)}</span>
                  {photo.folder && (
                    <span className="flex items-center gap-1 text-amber-600">
                      <Folder className="w-3 h-3" /> {photo.folder}
                    </span>
                  )}
                  <span>{new Date(photo.created_at).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button size="icon" variant="ghost" onClick={() => handleDownload(photo)} className="h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setDeleteTarget(photo)} className="h-8 w-8 text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Image viewer */}
      {viewImage && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center" onClick={() => setViewImage(null)}>
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.min(z + 0.25, 3)); }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setZoom(z => Math.max(z - 0.25, 0.5)); }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); setRotation(r => r + 90); }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <RotateCw className="w-5 h-5 text-white" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDownload(viewImage); }} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <Download className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => setViewImage(null)} className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30">
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
          <img
            src={viewImage.file_url}
            alt={viewImage.file_name}
            className="max-w-[90vw] max-h-[85vh] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
            {viewImage.file_name}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{deleteTarget?.file_name}". This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deleteTarget)}
              disabled={deleteMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
