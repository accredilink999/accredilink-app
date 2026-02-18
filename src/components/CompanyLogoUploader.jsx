import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X, Loader } from 'lucide-react';

export default function CompanyLogoUploader() {
  const [uploading, setUploading] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager';

  const saveMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ 
        company_name: companyName,
        company_contact_number: contactNumber
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setIsEditing(false);
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);
      const response = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ company_logo_url: response.file_url });
      return response.file_url;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setUploading(false);
    },
    onError: () => {
      setUploading(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({ company_logo_url: null });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const handleEditClick = () => {
    setCompanyName(user?.company_name || '');
    setContactNumber(user?.company_contact_number || '');
    setIsEditing(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl px-8 py-6 text-white">
      <div className="flex items-center justify-between gap-8">
        {/* Logo Section */}
        <div className="flex-shrink-0">
          {user?.company_logo_url ? (
            <img 
              src={user.company_logo_url} 
              alt="Company Logo" 
              className="h-24 w-auto object-contain bg-white rounded-lg p-2"
            />
          ) : (
            <div className="h-24 w-24 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-white text-sm">
              No logo
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading}
                className="hidden"
              />
              <Button 
                onClick={() => document.querySelector('input[type="file"]')?.click()}
                disabled={uploading}
                className="bg-white text-blue-600 hover:bg-blue-50"
                size="sm"
              >
                {uploading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </label>

            {user?.company_logo_url && (
              <Button
                onClick={() => deleteMutation.mutate()}
                variant="outline"
                className="border-white text-white hover:bg-white hover:bg-opacity-10"
                size="sm"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Company Details Section */}
        <div className="flex-1">
          <div className="flex justify-between items-start mb-4">
            {!isEditing && (
              <Button 
                onClick={handleEditClick} 
                className="bg-white text-blue-600 hover:bg-blue-50"
                size="sm"
              >
                Edit
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-blue-100 mb-1 block">Company Name</label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                  className="bg-white text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-100 mb-1 block">Contact Number</label>
                <Input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Enter contact number"
                  className="bg-white text-slate-900"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveMutation.mutate()}
                  className="bg-white text-blue-600 hover:bg-blue-50"
                  size="sm"
                >
                  Save
                </Button>
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:bg-opacity-10"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <p className="text-blue-100 text-sm">Contact Number</p>
                <p className="text-white text-lg font-semibold">{user?.company_contact_number || '—'}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}