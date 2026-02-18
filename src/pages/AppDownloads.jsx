import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { UploadFile } from '@/api/storage';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import {
  Smartphone,
  Apple,
  Globe,
  Upload,
  Trash2,
  FileDown,
  CheckCircle2,
  Loader2,
  Link as LinkIcon
} from 'lucide-react';

const PLATFORM_KEYS = {
  android: 'app_download_android',
  ios: 'app_download_ios',
  web: 'app_download_web',
};

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function PlatformUploadCard({ platform, icon: Icon, title, color, data, onSave, onDelete }) {
  const [version, setVersion] = useState(data?.version || '');
  const [notes, setNotes] = useState(data?.notes || '');
  const [link, setLink] = useState(data?.file_url || data?.link || data?.url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [useLink, setUseLink] = useState(platform === 'android');

  useEffect(() => {
    if (data) {
      setVersion(data.version || '');
      setNotes(data.notes || '');
      setLink(data.file_url || data.link || data.url || '');
    }
  }, [data]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    setUploading(true);

    const toastId = toast.loading(`Uploading ${file.name} (${sizeMB} MB)...`, { duration: Infinity });

    try {
      const { file_url } = await UploadFile({ file });
      const payload = {
        version: version || '1.0.0',
        file_url,
        filename: file.name,
        filesize: file.size,
        updated_at: new Date().toISOString(),
        notes,
      };
      await onSave(platform, payload);
      toast.dismiss(toastId);
      toast.success(`${title} uploaded (${sizeMB} MB)`);
    } catch (err) {
      console.error('Upload failed:', err);
      toast.dismiss(toastId);
      const msg = err?.message || err?.statusCode || '';
      if (String(msg).includes('Payload too large') || String(msg).includes('413') || String(msg).includes('file size') || String(msg).includes('exceeded')) {
        toast.error(
          'File exceeds the storage size limit. Use "Paste link instead" to link to a file hosted on Google Drive, Dropbox, etc.',
          { duration: 8000 }
        );
        setUseLink(true);
      } else {
        toast.error('Upload failed: ' + (msg || 'Unknown error. Check the browser console for details.'));
      }
    }
    setUploading(false);
    e.target.value = '';
  };

  const handleSaveLink = async () => {
    if (!link.trim()) {
      toast.error('Please enter a link');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        version: version || '1.0.0',
        [platform === 'android' ? 'file_url' : platform === 'ios' ? 'link' : 'url']: link.trim(),
        filename: platform === 'android' ? 'External link' : undefined,
        updated_at: new Date().toISOString(),
        notes,
      };
      await onSave(platform, payload);
      toast.success(`${title} link saved`);
    } catch (err) {
      toast.error('Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await onDelete(platform);
      setVersion('');
      setNotes('');
      setLink('');
      toast.success(`${title} download removed`);
    } catch (err) {
      toast.error('Failed to remove');
    }
  };

  const borderColor = {
    android: 'border-l-green-500',
    ios: 'border-l-slate-800',
    web: 'border-l-blue-500',
  }[platform];

  return (
    <Card className={`p-5 bg-white border-0 shadow-sm border-l-4 ${borderColor}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-slate-900 flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          {title}
        </h3>
        {data?.file_url || data?.link || data?.url ? (
          <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            v{data.version || '1.0.0'}
          </span>
        ) : null}
      </div>

      <div className="space-y-3">
        <div>
          <Label className="text-slate-700 text-sm mb-1 block">Version</Label>
          <Input
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            placeholder="e.g. 1.0.0"
            className="max-w-[200px]"
          />
        </div>

        {platform === 'android' ? (
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label className="text-slate-700 text-sm">APK File</Label>
              <button
                type="button"
                className="text-xs text-teal-600 hover:text-teal-700 underline"
                onClick={() => setUseLink(!useLink)}
              >
                {useLink ? 'Upload file instead' : 'Paste link instead'}
              </button>
            </div>

            {data?.file_url && (
              <div className="flex items-center gap-2 mb-2 text-sm text-slate-600 bg-slate-50 p-2 rounded">
                <FileDown className="w-4 h-4 flex-shrink-0" />
                <span className="truncate flex-1">{data.filename || 'Uploaded file'}</span>
                {data.filesize && (
                  <span className="text-xs text-slate-400 whitespace-nowrap">{formatFileSize(data.filesize)}</span>
                )}
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {data.updated_at ? new Date(data.updated_at).toLocaleDateString() : ''}
                </span>
              </div>
            )}

            {useLink ? (
              <div>
                <div className="flex gap-2">
                  <Input
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://drive.google.com/... or direct download URL"
                    className="flex-1"
                  />
                  <Button onClick={handleSaveLink} size="sm" disabled={saving}>
                    {saving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" />
                  Paste a Google Drive, Dropbox, or direct download link
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    accept=".apk,.aab"
                    onChange={handleFileUpload}
                    className="hidden"
                    id={`upload-${platform}`}
                    disabled={uploading}
                  />
                  <label htmlFor={`upload-${platform}`}>
                    <Button asChild variant="outline" size="sm" className="cursor-pointer" disabled={uploading}>
                      <span>
                        {uploading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4 mr-2" />
                        )}
                        {uploading ? 'Uploading...' : data?.file_url ? 'Replace File' : 'Upload APK'}
                      </span>
                    </Button>
                  </label>
                  {uploading && (
                    <span className="text-xs text-slate-500">This may take a moment for large files...</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <Label className="text-slate-700 text-sm mb-1 block">
              {platform === 'ios' ? 'TestFlight / App Store Link' : 'Web App URL'}
            </Label>
            <div className="flex gap-2">
              <Input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder={platform === 'ios' ? 'https://testflight.apple.com/join/...' : 'https://care-call-ai.vercel.app'}
                className="flex-1"
              />
              <Button onClick={handleSaveLink} size="sm" disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        )}

        <div>
          <Label className="text-slate-700 text-sm mb-1 block">Release Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What's new in this version..."
            rows={2}
          />
        </div>

        {(data?.file_url || data?.link || data?.url) && (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              Remove
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

export default function AppDownloads() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || user?.job_title === 'admin' || user?.job_title === 'manager';

  const { data: settings = [] } = useQuery({
    queryKey: ['appDownloadSettings'],
    queryFn: () => base44.entities.SystemSettings.filter({
      setting_key: [PLATFORM_KEYS.android, PLATFORM_KEYS.ios, PLATFORM_KEYS.web]
    }),
  });

  const getSettingData = (platform) => {
    const key = PLATFORM_KEYS[platform];
    const setting = settings.find(s => s.setting_key === key);
    if (!setting?.setting_value) return null;
    try {
      return JSON.parse(setting.setting_value);
    } catch {
      return null;
    }
  };

  const savePlatform = async (platform, payload) => {
    const key = PLATFORM_KEYS[platform];
    const existing = settings.find(s => s.setting_key === key);
    if (existing) {
      await base44.entities.SystemSettings.update(existing.id, {
        setting_value: JSON.stringify(payload),
      });
    } else {
      await base44.entities.SystemSettings.create({
        setting_key: key,
        setting_value: JSON.stringify(payload),
        description: `App download info for ${platform}`,
      });
    }
    queryClient.invalidateQueries({ queryKey: ['appDownloadSettings'] });
  };

  const deletePlatform = async (platform) => {
    const key = PLATFORM_KEYS[platform];
    const existing = settings.find(s => s.setting_key === key);
    if (existing) {
      await base44.entities.SystemSettings.delete(existing.id);
      queryClient.invalidateQueries({ queryKey: ['appDownloadSettings'] });
    }
  };

  if (!isAdmin) {
    return (
      <div className="p-6 text-center text-slate-500">
        Admin access required.
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <PageHeader
        title="App Downloads"
        subtitle="Upload app files and manage download links for your team"
      />

      <PlatformUploadCard
        platform="android"
        icon={Smartphone}
        title="Android App"
        color="text-green-600"
        data={getSettingData('android')}
        onSave={savePlatform}
        onDelete={deletePlatform}
      />

      <PlatformUploadCard
        platform="ios"
        icon={Apple}
        title="iOS App"
        color="text-slate-800"
        data={getSettingData('ios')}
        onSave={savePlatform}
        onDelete={deletePlatform}
      />

      <PlatformUploadCard
        platform="web"
        icon={Globe}
        title="Web App (PWA)"
        color="text-blue-600"
        data={getSettingData('web')}
        onSave={savePlatform}
        onDelete={deletePlatform}
      />

      <Card className="p-4 bg-slate-50 border-0">
        <p className="text-sm text-slate-600">
          Uploaded files and links will appear in every user's <strong>Settings</strong> page under
          "Get the App" so staff can download and install the app on their devices.
        </p>
      </Card>
    </div>
  );
}
