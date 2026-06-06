import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ShiftApi } from '@/api/rotaApi';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// Tabs removed — icon tile navigation
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import Avatar from '@/components/ui/Avatar';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Award,
  Clock,
  Save,
  Upload,
  Loader2,
  Camera,
  FileText,
  Download,
  Trash2,
  File,
  FileImage,
  FileVideo,
  FileArchive,
  LogOut,
  Settings,
  ChevronLeft,
  LayoutGrid,
  ClipboardCheck
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import AppDownloadGuide from '@/components/profile/AppDownloadGuide';
import StaffMyMatrix from '@/components/profile/StaffMyMatrix';
import StaffCompetencies from '@/components/profile/StaffCompetencies';

export default function Profile() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteFileConfirm, setDeleteFileConfirm] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const videoRef = React.useRef(null);
  const canvasRef = React.useRef(null);
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const [formData, setFormData] = useState({});

  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        staff_full_name: user.staff_full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        emergency_contact_name: user.emergency_contact_name || '',
        emergency_contact_phone: user.emergency_contact_phone || '',
      }));
    }
  }, [user?.id]);

  const { data: training = [] } = useQuery({
    queryKey: ['myTraining', user?.id],
    queryFn: () => base44.entities.Training.filter({ staff_id: user?.id }),
    enabled: !!user?.id
  });

  const { data: shifts = [] } = useQuery({
    queryKey: ['myShifts', user?.id],
    queryFn: () => ShiftApi.filter({ staff_id: user?.id }, '-date', 50),
    enabled: !!user?.id
  });

  const { data: sharedFiles = [], refetch: refetchFiles } = useQuery({
    queryKey: ['mySharedFiles', user?.id],
    queryFn: () => base44.entities.SharedFile.filter({ uploaded_by: user?.id }, '-created_date', 100),
    enabled: !!user?.id
  });

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      // Update all fields
      await base44.auth.updateMe({
        staff_full_name: data.staff_full_name,
        phone: data.phone,
        address: data.address,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.refetchQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
      toast.success('Profile updated');
    },
    onError: () => {
      toast.error('Failed to update profile');
    }
  });

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Profile picture saved');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to save profile picture');
    }
    setUploading(false);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (error) {
      console.error('Camera access denied:', error);
      toast.error('Camera access denied — check browser permissions');
    }
  };

  // Callback ref — fires the instant the <video> DOM node mounts inside the Dialog portal
  const attachStream = useCallback((node) => {
    videoRef.current = node;
    if (node && stream) {
      node.srcObject = stream;
    }
  }, [stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const takeSelfie = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    if (!video.videoWidth || !video.videoHeight) {
      toast.error('Camera not ready — wait a moment and try again');
      return;
    }

    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);

    // Create blob BEFORE closing dialog — canvas is inside the Dialog portal,
    // so it gets unmounted when showCamera becomes false.
    let blob;
    try {
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    } catch {
      blob = null;
    }

    // Now safe to close dialog and stop camera
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);

    if (!blob) {
      toast.error('Failed to capture image');
      return;
    }

    setUploading(true);
    try {
      const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ photo_url: file_url });
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      toast.success('Selfie saved');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to save selfie');
    }
    setUploading(false);
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      // Could add AlertDialog for file size error if needed
      return;
    }

    setUploadingFile(true);
    setUploadProgress(10);

    try {
      setUploadProgress(30);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setUploadProgress(70);

      await base44.entities.SharedFile.create({
        title: file.name,
        file_name: file.name,
        file_url: file_url,
        file_size: file.size,
        file_type: file.type || 'application/octet-stream',
        uploaded_by: user?.id,
        uploaded_by_name: user?.staff_full_name || user?.full_name,
        category: 'other'
      });

      setUploadProgress(100);
      refetchFiles();
      toast.success('File uploaded');
      } catch (error) {
      console.error('File upload failed:', error);
      toast.error('Failed to upload file');
      } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      }
  };

  const handleDeleteFile = (fileId) => {
    setFileToDelete(fileId);
    setDeleteFileConfirm(true);
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      await base44.entities.SharedFile.delete(fileToDelete);
      refetchFiles();
      setDeleteFileConfirm(false);
      setFileToDelete(null);
      toast.success('File deleted');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete file');
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType) => {
    if (!fileType) return File;
    if (fileType.startsWith('image/')) return FileImage;
    if (fileType.startsWith('video/')) return FileVideo;
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('tar')) return FileArchive;
    if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) return FileText;
    return File;
  };

  const completedShifts = shifts.filter(s => s.status === 'completed').length;
  const validTraining = training.filter(t => t.status === 'valid').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 overflow-hidden w-full max-w-full">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information"
        className="[&_h1]:text-lg [&_h1]:sm:text-2xl [&_h1]:text-slate-900"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-w-0">
         {/* Profile Card */}
         <Card className="p-3 sm:p-6 bg-white border-0 shadow-sm lg:col-span-1 overflow-hidden min-w-0">
          <div className="text-center">
            <div className="relative inline-block">
              <Avatar name={user?.staff_full_name || user?.full_name} size="xl" src={user?.photo_url} className="w-24 h-24" />
              <div className="absolute bottom-0 right-0 flex gap-1">
                <button
                  onClick={startCamera}
                  disabled={uploading}
                  className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <label className="w-8 h-8 bg-teal-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-teal-700 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Upload className="w-4 h-4 text-white" />
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <h2 className="text-base sm:text-xl font-bold text-slate-900 mt-4 truncate">{user?.staff_full_name || user?.full_name}</h2>
            <p className="text-sm text-slate-500 capitalize truncate">{user?.job_title?.replace(/_/g, ' ') || user?.role}</p>

            <div className="flex justify-center gap-4 mt-4 sm:mt-6">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-teal-600">{completedShifts}</p>
                <p className="text-xs text-slate-500">Visits</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-purple-600">{validTraining}</p>
                <p className="text-xs text-slate-500">Certifications</p>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-3 text-sm min-w-0">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-600 truncate">{user?.email}</span>
            </div>
            {user?.phone && (
              <div className="flex items-center gap-3 text-sm min-w-0">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate">{user?.phone}</span>
              </div>
            )}
            {user?.address && (
              <div className="flex items-center gap-3 text-sm min-w-0">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate">{user?.address}</span>
              </div>
            )}
            {user?.start_date && (
              <div className="flex items-center gap-3 text-sm min-w-0">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate">Started {format(new Date(user?.start_date), 'dd MMM yyyy')}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Details Section */}
        <Card className="p-3 sm:p-6 bg-white border-0 shadow-sm lg:col-span-2 overflow-hidden min-w-0">
          {activeSection ? (
            <div>
              <button
                onClick={() => { setActiveSection(null); setIsEditing(false); }}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-900 mb-4 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Back to Profile
              </button>

              {activeSection === 'details' && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex flex-wrap justify-between items-center gap-2">
                    <h3 className="font-semibold text-slate-900 text-sm sm:text-base">Personal Information</h3>
                    {!isEditing ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => {
                          setIsEditing(false);
                          setFormData({
                            staff_full_name: user.staff_full_name || '',
                            phone: user.phone || '',
                            address: user.address || '',
                            emergency_contact_name: user.emergency_contact_name || '',
                            emergency_contact_phone: user.emergency_contact_phone || '',
                          });
                        }}>
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSave}
                          disabled={updateMutation.isPending}
                          className="bg-teal-600 hover:bg-teal-700"
                        >
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                    <Label>Staff Name</Label>
                    {isEditing ? (
                      <Input
                        value={formData.staff_full_name || ''}
                        onChange={(e) => setFormData({...formData, staff_full_name: e.target.value})}
                        placeholder="Your staff name"
                      />
                    ) : (
                      <p className="mt-1 text-slate-600">{user?.staff_full_name || '-'}</p>
                    )}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>Phone</Label>
                      {isEditing ? (
                        <Input
                          value={formData.phone || ''}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        />
                      ) : (
                        <p className="mt-1 text-slate-600">{user?.phone || '-'}</p>
                      )}
                    </div>
                    <div>
                      <Label>Address</Label>
                      {isEditing ? (
                        <Input
                          value={formData.address || ''}
                          onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                      ) : (
                        <p className="mt-1 text-slate-600">{user?.address || '-'}</p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Emergency Contact
                    </h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <Label>Name</Label>
                        {isEditing ? (
                          <Input
                            value={formData.emergency_contact_name || ''}
                            onChange={(e) => setFormData({...formData, emergency_contact_name: e.target.value})}
                          />
                        ) : (
                          <p className="mt-1 text-slate-600">{user?.emergency_contact_name || '-'}</p>
                        )}
                      </div>
                      <div>
                        <Label>Phone</Label>
                        {isEditing ? (
                          <Input
                            value={formData.emergency_contact_phone || ''}
                            onChange={(e) => setFormData({...formData, emergency_contact_phone: e.target.value})}
                          />
                        ) : (
                          <p className="mt-1 text-slate-600">{user?.emergency_contact_phone || '-'}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-700 mb-3">Compliance</h4>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">DBS Number:</span>
                        <p className="font-medium">{user?.dbs_number || 'Not recorded'}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">DBS Expiry:</span>
                        <p className="font-medium">
                          {user?.dbs_expiry ? format(new Date(user?.dbs_expiry), 'dd MMM yyyy') : 'Not recorded'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'files' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 sm:p-6 text-center hover:border-teal-400 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadingFile}
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      {uploadingFile ? (
                        <div className="space-y-3">
                          <Loader2 className="w-10 h-10 mx-auto text-teal-600 animate-spin" />
                          <p className="text-sm text-slate-600">Uploading... {uploadProgress}%</p>
                          <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                          <p className="text-sm text-slate-600 mb-1">Click to upload a file</p>
                          <p className="text-xs text-slate-400">Max 50MB per file</p>
                        </>
                      )}
                    </label>
                  </div>

                  {sharedFiles.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No files uploaded yet</p>
                  ) : (
                    <div className="space-y-2">
                      {sharedFiles.map((file) => {
                        const FileIcon = getFileIcon(file.file_type);
                        return (
                          <div key={file.id} className="flex items-center justify-between p-2 sm:p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                                <FileIcon className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{file.file_name}</p>
                                <p className="text-[10px] sm:text-xs text-slate-500">
                                  {formatFileSize(file.file_size)} • {file.created_date ? format(new Date(file.created_date), 'dd MMM yyyy') : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <a
                                href={file.file_url}
                                download={file.file_name}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-teal-600 hover:bg-teal-100 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteFile(file.id)}
                                className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'training' && (
                <div>
                  {training.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No training records</p>
                  ) : (
                    <div className="space-y-3">
                      {training.map((t) => (
                        <div key={t.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-slate-50 rounded-lg">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            t.status === 'valid' ? 'bg-emerald-100' :
                            t.status === 'expiring_soon' ? 'bg-amber-100' : 'bg-red-100'
                          }`}>
                            <Award className={`w-4 h-4 sm:w-5 sm:h-5 ${
                              t.status === 'valid' ? 'text-emerald-600' :
                              t.status === 'expiring_soon' ? 'text-amber-600' : 'text-red-600'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{t.training_name}</p>
                            <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                              {t.category} • {t.expiry_date ? format(new Date(t.expiry_date), 'dd MMM yy') : 'N/A'}
                            </p>
                          </div>
                          <StatusBadge status={t.status} className="flex-shrink-0 text-[10px] sm:text-xs" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeSection === 'activity' && (
                <div className="space-y-3">
                  {shifts.slice(0, 10).map((shift) => (
                    <div key={shift.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-slate-50 rounded-lg">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        shift.status === 'completed' ? 'bg-emerald-100' :
                        shift.status === 'in_progress' ? 'bg-teal-100' : 'bg-slate-100'
                      }`}>
                        <Clock className={`w-4 h-4 sm:w-5 sm:h-5 ${
                          shift.status === 'completed' ? 'text-emerald-600' :
                          shift.status === 'in_progress' ? 'text-teal-600' : 'text-slate-400'
                        }`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-900 text-xs sm:text-sm truncate">{shift.service_user_name}</p>
                        <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                          {format(new Date(shift.date), 'dd MMM')} • {shift.start_time} - {shift.end_time}
                        </p>
                      </div>
                      <StatusBadge status={shift.status} className="flex-shrink-0 text-[10px] sm:text-xs" />
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'matrix' && (
                <StaffMyMatrix userId={user?.id} />
              )}

              {activeSection === 'competencies' && (
                <StaffCompetencies userId={user?.id} />
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'details', label: 'My Details', icon: User, bg: 'from-blue-400 to-blue-600', desc: 'Personal info & emergency' },
                { value: 'files', label: 'My Files', icon: Upload, bg: 'from-teal-400 to-teal-600', desc: 'Upload & manage files' },
                { value: 'training', label: 'Training', icon: Award, bg: 'from-purple-400 to-purple-600', desc: 'Certificates & CPD' },
                { value: 'activity', label: 'Activity', icon: Clock, bg: 'from-amber-400 to-amber-600', desc: 'Recent shift history' },
                { value: 'matrix', label: 'My Matrix', icon: LayoutGrid, bg: 'from-rose-400 to-rose-600', desc: 'Compliance & training docs' },
                { value: 'competencies', label: 'Competencies', icon: ClipboardCheck, bg: 'from-violet-400 to-violet-600', desc: 'Probationary & skills assessments' },
              ].map(section => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.value}
                    onClick={() => setActiveSection(section.value)}
                    className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95"
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
                    </div>
                    <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
                      {section.label}
                    </span>
                    <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">
                      {section.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <AlertDialog open={deleteFileConfirm} onOpenChange={setDeleteFileConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteFile}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quick Actions */}
      <div className="mt-6 space-y-2">
        <Button
          variant="outline"
          onClick={() => window.location.href = '/Settings'}
          className="w-full justify-start text-slate-600 hover:text-slate-900"
        >
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
        <Button
          variant="outline"
          onClick={() => base44.auth.logout()}
          className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Take a Selfie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video">
              <video
                ref={attachStream}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex gap-2">
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                Cancel
              </Button>
              <Button onClick={takeSelfie} className="flex-1 bg-teal-600 hover:bg-teal-700">
                <Camera className="w-4 h-4 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}