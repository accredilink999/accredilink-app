import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Smartphone, 
  Monitor, 
  Apple,
  Chrome,
  Copy,
  CheckCircle,
  Upload,
  File
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';

export default function AppDownloadGuide() {
  const [copiedSection, setCopiedSection] = useState(null);
  const [uploading, setUploading] = useState(false);

  const { data: user, refetch } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.auth.updateMe({ 
        app_download_file_url: file_url,
        app_download_file_name: file.name
      });
      await refetch();
      toast.success('App file uploaded successfully');
      e.target.value = '';
    } catch (error) {
      toast.error('Failed to upload file');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };
  
  const appUrl = window.location.origin;
  
  const copyToClipboard = (text, section) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
        <p className="text-sm text-teal-900">
          <span className="font-semibold">No Download Needed:</span> This is a Progressive Web App (PWA). Simply visit the URL on your device and add it to your home screen for quick access.
        </p>
      </div>
      {/* Desktop Installation */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
            <Monitor className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Desktop</h3>
            <p className="text-sm text-slate-500">Windows, Mac, or Linux</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-slate-600 pl-15">
          <div>
            <p className="font-medium text-slate-900 mb-2">Using Chrome or Edge:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Visit the app URL</li>
              <li>Click the install icon (top right of address bar)</li>
              <li>Click "Install"</li>
              <li>App opens as a desktop window</li>
            </ol>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs font-mono text-blue-900 break-all">{appUrl}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(appUrl, 'desktop')}
            className="mt-2 h-7"
          >
            {copiedSection === 'desktop' ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Copied</>
            ) : (
              <><Copy className="w-3 h-3 mr-1" /> Copy URL</>
            )}
          </Button>
        </div>
      </Card>

      {/* Android Installation */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
            <Chrome className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">Android</h3>
            <p className="text-sm text-slate-500">Android 5.0 and above</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-slate-600 pl-15">
          <div>
            <p className="font-medium text-slate-900 mb-2">Using Chrome:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open Chrome on your Android device</li>
              <li>Visit the app URL</li>
              <li>Tap the menu (3 dots, top right)</li>
              <li>Select "Install app" or "Add to Home screen"</li>
              <li>App icon appears on your home screen</li>
            </ol>
          </div>
          <p className="text-xs text-slate-500 mt-4">💡 The app works like a native app with offline support and instant access from your home screen.</p>
        </div>
        
        <div className="mt-4 p-3 bg-green-50 rounded-lg">
          <p className="text-xs font-mono text-green-900 break-all">{appUrl}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(appUrl, 'android')}
            className="mt-2 h-7"
          >
            {copiedSection === 'android' ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Copied</>
            ) : (
              <><Copy className="w-3 h-3 mr-1" /> Copy URL</>
            )}
          </Button>
        </div>
      </Card>

      {/* iOS Installation */}
      <Card className="p-6 bg-white border-0 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
            <Apple className="w-6 h-6 text-slate-900" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">iOS</h3>
            <p className="text-sm text-slate-500">iOS 13.4 and above</p>
          </div>
        </div>
        
        <div className="space-y-3 text-sm text-slate-600 pl-15">
          <div>
            <p className="font-medium text-slate-900 mb-2">Using Safari:</p>
            <ol className="list-decimal pl-5 space-y-1">
              <li>Open Safari on your iPhone or iPad</li>
              <li>Visit the app URL</li>
              <li>Tap the Share button (bottom of screen)</li>
              <li>Scroll down and tap "Add to Home Screen"</li>
              <li>Name the app and tap "Add"</li>
              <li>App icon appears on your home screen</li>
            </ol>
          </div>
          <p className="text-xs text-slate-500 mt-4">💡 The app works like a native app with offline support and can be accessed directly from your home screen.</p>
        </div>
        
        <div className="mt-4 p-3 bg-slate-50 rounded-lg">
          <p className="text-xs font-mono text-slate-900 break-all">{appUrl}</p>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(appUrl, 'ios')}
            className="mt-2 h-7"
          >
            {copiedSection === 'ios' ? (
              <><CheckCircle className="w-3 h-3 mr-1" /> Copied</>
            ) : (
              <><Copy className="w-3 h-3 mr-1" /> Copy URL</>
            )}
          </Button>
        </div>
      </Card>

      {/* Quick Open Button */}
      <Card className="p-6 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-semibold text-slate-900">Quick Install</h4>
            <p className="text-sm text-slate-600">Copy the URL and visit it on your device</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => copyToClipboard(appUrl, 'quick')}
            className="h-7"
          >
            {copiedSection === 'quick' ? (
              <><CheckCircle className="w-4 h-4 mr-1" /> Copied</>
            ) : (
              <><Copy className="w-4 h-4 mr-1" /> Copy</>
            )}
          </Button>
        </div>
      </Card>

      {/* Admin File Upload */}
      {isAdmin && (
        <Card className="p-6 bg-white border-0 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
              <Upload className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">App Download File</h3>
              <p className="text-sm text-slate-500">Admin only</p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-slate-600">Upload an app file (APK, IPA, etc.) for download:</p>
            <div>
              <input
                type="file"
                id="app-file-input"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
                accept=".apk,.ipa,.zip,.exe,.dmg"
              />
              <Button
                disabled={uploading}
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => document.getElementById('app-file-input')?.click()}
              >
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Choose File'}
              </Button>
            </div>
            {user?.app_download_file_url && (
              <div className="p-3 bg-purple-50 rounded-lg flex items-center gap-2">
                <File className="w-4 h-4 text-purple-600" />
                <a href={user.app_download_file_url} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-600 hover:underline flex-1">
                  {user.app_download_file_name || 'Download Current File'}
                </a>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}