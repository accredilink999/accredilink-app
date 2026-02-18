import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Key, CheckCircle2, PlayCircle, Apple, Globe, Info, Copy, Eye, EyeOff, ShieldCheck, FileJson } from 'lucide-react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function MaskedInput({ value, onChange, placeholder, className }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={className}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PushCredentialsManager() {
  const queryClient = useQueryClient();
  const [editingType, setEditingType] = useState(null);
  const [formData, setFormData] = useState({});

  // Push credentials (server key, APNS)
  const { data: credentials = [] } = useQuery({
    queryKey: ['notificationCredentials'],
    queryFn: () => base44.entities.NotificationCredentials.list(),
  });

  // Firebase Web Config & VAPID stored in SystemSettings
  const { data: systemSettings = [] } = useQuery({
    queryKey: ['firebaseWebSettings'],
    queryFn: () => base44.entities.SystemSettings.filter({
      setting_key: ['firebase_web_config', 'firebase_vapid_key', 'firebase_service_account'],
    }),
  });

  const firebaseCredential = credentials.find(c => c.credential_type === 'firebase');
  const apnsCredential = credentials.find(c => c.credential_type === 'apns');
  const webConfigSetting = systemSettings.find(s => s.setting_key === 'firebase_web_config');
  const vapidSetting = systemSettings.find(s => s.setting_key === 'firebase_vapid_key');
  const serviceAccountSetting = systemSettings.find(s => s.setting_key === 'firebase_service_account');

  // Save push credentials (server key / APNS)
  const saveCredentialMutation = useMutation({
    mutationFn: async (data) => {
      const existing = credentials.find(c => c.credential_type === data.credential_type);
      if (existing) {
        await base44.entities.NotificationCredentials.update(existing.id, data);
      } else {
        await base44.entities.NotificationCredentials.create(data);
      }

      // For APNS credentials, also save to system_settings so the
      // sendAPNSPushNotification edge function can find them
      if (data.credential_type === 'apns') {
        const apnsSettingValue = {
          key_id: data.apns_key_id,
          team_id: data.apns_team_id,
          private_key: data.apns_auth_key,
          bundle_id: data.apns_bundle_id || 'com.carecallai.app',
          environment: data.apns_environment || 'production',
        };
        await saveSetting(
          'apns_credentials',
          apnsSettingValue,
          'APNs auth key credentials for iOS push notifications'
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationCredentials'] });
      queryClient.invalidateQueries({ queryKey: ['firebaseWebSettings'] });
      toast.success('Credentials saved');
      setEditingType(null);
      setFormData({});
    },
    onError: (error) => toast.error('Failed to save credentials: ' + error.message),
  });

  // Save a single SystemSettings key
  const saveSetting = async (key, value, description) => {
    const existing = systemSettings.find(s => s.setting_key === key);
    if (existing) {
      return base44.entities.SystemSettings.update(existing.id, { setting_value: value });
    }
    return base44.entities.SystemSettings.create({ setting_key: key, setting_value: value, description });
  };

  // Save Firebase Web Config + VAPID
  const saveWebConfigMutation = useMutation({
    mutationFn: async (data) => {
      await Promise.all([
        saveSetting('firebase_web_config', data.config, 'Firebase Web App config JSON'),
        saveSetting('firebase_vapid_key', data.vapidKey, 'Firebase VAPID key for Web Push'),
      ]);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firebaseWebSettings'] });
      toast.success('Firebase Web config saved');
      setEditingType(null);
      setFormData({});
    },
    onError: (e) => toast.error('Failed to save: ' + e.message),
  });

  // Save Firebase Service Account JSON
  const saveServiceAccountMutation = useMutation({
    mutationFn: async (jsonStr) => {
      // Validate the JSON has required fields
      const parsed = typeof jsonStr === 'string' ? JSON.parse(jsonStr) : jsonStr;
      if (!parsed.client_email || !parsed.private_key || !parsed.project_id) {
        throw new Error('Service account JSON must contain client_email, private_key, and project_id');
      }
      // Save as parsed object so JSONB column stores it correctly for edge functions
      await saveSetting('firebase_service_account', parsed, 'Firebase service account JSON for FCM HTTP v1 API');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['firebaseWebSettings'] });
      toast.success('Service account saved — push notifications are now enabled');
      setEditingType(null);
      setFormData({});
    },
    onError: (e) => toast.error('Failed to save: ' + e.message),
  });

  // Start editing a section
  const startEdit = (type) => {
    setEditingType(type);
    if (type === 'service_account') {
      const sv = serviceAccountSetting?.setting_value;
      const jsonStr = typeof sv === 'string' ? sv : (sv ? JSON.stringify(sv, null, 2) : '');
      setFormData({ serviceAccountJson: jsonStr });
    } else if (type === 'firebase' && firebaseCredential) {
      setFormData({
        credential_type: 'firebase',
        firebase_server_key: firebaseCredential.firebase_server_key || '',
        is_active: firebaseCredential.is_active,
      });
    } else if (type === 'apns' && apnsCredential) {
      setFormData({
        credential_type: 'apns',
        apns_auth_key: apnsCredential.apns_auth_key || '',
        apns_key_id: apnsCredential.apns_key_id || '',
        apns_team_id: apnsCredential.apns_team_id || '',
        apns_bundle_id: apnsCredential.apns_bundle_id || '',
        apns_environment: apnsCredential.apns_environment || 'sandbox',
        is_active: apnsCredential.is_active,
      });
    } else if (type === 'firebase_web') {
      let existingConfig = {};
      if (webConfigSetting?.setting_value) {
        try {
          existingConfig = typeof webConfigSetting.setting_value === 'string'
            ? JSON.parse(webConfigSetting.setting_value)
            : webConfigSetting.setting_value;
        } catch { /* ignore */ }
      }
      setFormData({
        apiKey: existingConfig.apiKey || '',
        authDomain: existingConfig.authDomain || '',
        projectId: existingConfig.projectId || '',
        storageBucket: existingConfig.storageBucket || '',
        messagingSenderId: existingConfig.messagingSenderId || '',
        appId: existingConfig.appId || '',
        vapidKey: vapidSetting?.setting_value || '',
      });
    } else {
      setFormData({
        credential_type: type,
        is_active: true,
        ...(type === 'apns' && { apns_environment: 'sandbox' }),
      });
    }
  };

  const webConfigured = !!(webConfigSetting?.setting_value && vapidSetting?.setting_value);
  const serviceAccountConfigured = !!serviceAccountSetting?.setting_value;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-500 text-sm">
          Configure push notification keys for web, Android, and iOS platforms.
        </p>
      </div>

      {/* Instructions banner */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900 space-y-1">
              <p className="font-medium">Setup guide:</p>
              <ul className="list-disc ml-5 space-y-1 text-blue-800">
                <li><strong>Firebase Web:</strong> Firebase Console → Project Settings → General → Your apps → Web app config</li>
                <li><strong>VAPID Key:</strong> Firebase Console → Project Settings → Cloud Messaging → Web Push certificates → Generate key pair</li>
                <li><strong>Service Account:</strong> Firebase Console → Project Settings → Service accounts → Generate new private key (JSON file)</li>
                <li><strong>Firebase Server Key:</strong> Project Settings → Cloud Messaging → Server key (legacy, optional)</li>
                <li><strong>APNS:</strong> Apple Developer Portal → Certificates, Identifiers &amp; Profiles → Keys → AuthKey (.p8)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Firebase Web Config (PWA + Web push)                               */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Firebase Web Config (PWA / Browser Push)
            </CardTitle>
            {webConfigured && <Badge className="bg-green-100 text-green-800">Configured</Badge>}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {editingType === 'firebase_web' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Paste the values from your Firebase project web app config object.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { field: 'apiKey', label: 'API Key', placeholder: 'AIzaSy...' },
                  { field: 'authDomain', label: 'Auth Domain', placeholder: 'your-app.firebaseapp.com' },
                  { field: 'projectId', label: 'Project ID', placeholder: 'your-project-id' },
                  { field: 'storageBucket', label: 'Storage Bucket', placeholder: 'your-app.appspot.com' },
                  { field: 'messagingSenderId', label: 'Messaging Sender ID', placeholder: '123456789012' },
                  { field: 'appId', label: 'App ID', placeholder: '1:123456789012:web:abc123...' },
                ].map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
                    <Input
                      value={formData[field] || ''}
                      onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                      placeholder={placeholder}
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  VAPID Key (Web Push certificate)
                </label>
                <MaskedInput
                  value={formData.vapidKey || ''}
                  onChange={(e) => setFormData({ ...formData, vapidKey: e.target.value })}
                  placeholder="BNL3...your VAPID public key..."
                />
                <p className="text-xs text-slate-400 mt-1">
                  Found in Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveWebConfigMutation.mutate({
                    config: {
                      apiKey: formData.apiKey,
                      authDomain: formData.authDomain,
                      projectId: formData.projectId,
                      storageBucket: formData.storageBucket,
                      messagingSenderId: formData.messagingSenderId,
                      appId: formData.appId,
                    },
                    vapidKey: formData.vapidKey,
                  })}
                  disabled={
                    !formData.apiKey || !formData.projectId || !formData.appId || !formData.vapidKey ||
                    saveWebConfigMutation.isPending
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {saveWebConfigMutation.isPending ? 'Saving…' : 'Save Web Config'}
                </Button>
                <Button variant="outline" onClick={() => { setEditingType(null); setFormData({}); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {webConfigured ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Web config &amp; VAPID key configured</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Project: {(() => {
                        try {
                          const cfg = typeof webConfigSetting.setting_value === 'string'
                            ? JSON.parse(webConfigSetting.setting_value)
                            : webConfigSetting.setting_value;
                          return cfg.projectId || '—';
                        } catch { return '—'; }
                      })()}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => startEdit('firebase_web')}>Edit</Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-3">Not configured — required for web and PWA push notifications</p>
                  <Button onClick={() => startEdit('firebase_web')} className="bg-blue-600 hover:bg-blue-700">
                    <Key className="w-4 h-4 mr-2" />
                    Add Firebase Web Config
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Firebase Service Account (required for sending push)               */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Firebase Service Account (Required for Push)
            </CardTitle>
            {serviceAccountConfigured && <Badge className="bg-green-100 text-green-800">Configured</Badge>}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {editingType === 'service_account' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Paste the entire contents of the service account JSON key file downloaded from Firebase Console.
                This is required for the server to send push notifications via FCM HTTP v1 API.
              </p>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1">
                  Service Account JSON *
                </label>
                <Textarea
                  value={formData.serviceAccountJson || ''}
                  onChange={(e) => setFormData({ ...formData, serviceAccountJson: e.target.value })}
                  placeholder='{"type": "service_account", "project_id": "...", "private_key": "...", "client_email": "...", ...}'
                  rows={6}
                  className="text-xs font-mono"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Firebase Console → Project Settings → Service accounts → Generate new private key
                </p>
              </div>
              {formData.serviceAccountJson && (() => {
                try {
                  const parsed = JSON.parse(formData.serviceAccountJson);
                  const hasRequired = parsed.client_email && parsed.private_key && parsed.project_id;
                  return (
                    <div className={`text-xs p-2 rounded ${hasRequired ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {hasRequired ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />
                          Valid — Project: {parsed.project_id}, Email: {parsed.client_email}
                        </>
                      ) : (
                        'Missing required fields: client_email, private_key, or project_id'
                      )}
                    </div>
                  );
                } catch {
                  return <div className="text-xs p-2 rounded bg-red-50 text-red-700">Invalid JSON format</div>;
                }
              })()}
              <div className="flex gap-2">
                <Button
                  onClick={() => saveServiceAccountMutation.mutate(formData.serviceAccountJson)}
                  disabled={!formData.serviceAccountJson || saveServiceAccountMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saveServiceAccountMutation.isPending ? 'Saving...' : 'Save Service Account'}
                </Button>
                <Button variant="outline" onClick={() => { setEditingType(null); setFormData({}); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {serviceAccountConfigured ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Service account configured</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {(() => {
                        try {
                          const sa = typeof serviceAccountSetting.setting_value === 'string'
                            ? JSON.parse(serviceAccountSetting.setting_value)
                            : serviceAccountSetting.setting_value;
                          return `Project: ${sa.project_id || '—'} | ${sa.client_email || '—'}`;
                        } catch { return 'Saved'; }
                      })()}
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => startEdit('service_account')}>Edit</Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-2">Not configured — required for sending push notifications</p>
                  <p className="text-xs text-slate-400 mb-3">
                    Without this, the server cannot authenticate with Firebase to deliver push notifications.
                  </p>
                  <Button onClick={() => startEdit('service_account')} className="bg-emerald-600 hover:bg-emerald-700">
                    <FileJson className="w-4 h-4 mr-2" />
                    Add Service Account
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* Firebase Server Key (Android backend — legacy, optional)           */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-orange-600" />
              Firebase Server Key (Android / Backend)
            </CardTitle>
            {firebaseCredential?.is_active && (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {editingType === 'firebase' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Firebase Server Key *
                </label>
                <MaskedInput
                  value={formData.firebase_server_key || ''}
                  onChange={(e) => setFormData({ ...formData, firebase_server_key: e.target.value })}
                  placeholder="Paste your Firebase Server Key here..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveCredentialMutation.mutate(formData)}
                  disabled={!formData.firebase_server_key || saveCredentialMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-700"
                >
                  {saveCredentialMutation.isPending ? 'Saving…' : 'Save Server Key'}
                </Button>
                <Button variant="outline" onClick={() => { setEditingType(null); setFormData({}); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {firebaseCredential ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Server key configured</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {firebaseCredential.firebase_server_key?.substring(0, 20)}…
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => startEdit('firebase')}>Edit</Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-3">No server key configured</p>
                  <Button onClick={() => startEdit('firebase')} className="bg-orange-600 hover:bg-orange-700">
                    <Key className="w-4 h-4 mr-2" />
                    Add Firebase Server Key
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ------------------------------------------------------------------ */}
      {/* APNS Credentials (iOS)                                             */}
      {/* ------------------------------------------------------------------ */}
      <Card>
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Apple className="w-5 h-5 text-slate-700" />
              Apple Push Notification Service (iOS)
            </CardTitle>
            {apnsCredential?.is_active && (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {editingType === 'apns' ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Authentication Key (JWT) *</label>
                <Textarea
                  value={formData.apns_auth_key || ''}
                  onChange={(e) => setFormData({ ...formData, apns_auth_key: e.target.value })}
                  placeholder="Paste your APNS .p8 auth key..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Key ID *</label>
                  <Input
                    value={formData.apns_key_id || ''}
                    onChange={(e) => setFormData({ ...formData, apns_key_id: e.target.value })}
                    placeholder="ABC123XYZ4"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 block mb-2">Team ID *</label>
                  <Input
                    value={formData.apns_team_id || ''}
                    onChange={(e) => setFormData({ ...formData, apns_team_id: e.target.value })}
                    placeholder="ABCXYZ1234"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Bundle ID *</label>
                <Input
                  value={formData.apns_bundle_id || ''}
                  onChange={(e) => setFormData({ ...formData, apns_bundle_id: e.target.value })}
                  placeholder="com.carecallai.app"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">Environment *</label>
                <Select
                  value={formData.apns_environment || 'sandbox'}
                  onValueChange={(value) => setFormData({ ...formData, apns_environment: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Sandbox (Development / TestFlight)</SelectItem>
                    <SelectItem value="production">Production (App Store)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => saveCredentialMutation.mutate(formData)}
                  disabled={
                    !formData.apns_auth_key || !formData.apns_key_id ||
                    !formData.apns_team_id || !formData.apns_bundle_id ||
                    saveCredentialMutation.isPending
                  }
                  className="bg-slate-700 hover:bg-slate-800"
                >
                  {saveCredentialMutation.isPending ? 'Saving…' : 'Save APNS Credentials'}
                </Button>
                <Button variant="outline" onClick={() => { setEditingType(null); setFormData({}); }}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {apnsCredential ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">APNS credentials configured</p>
                    <div className="text-xs text-slate-400 mt-1 space-y-0.5">
                      <p>Bundle ID: {apnsCredential.apns_bundle_id}</p>
                      <p>Environment: {apnsCredential.apns_environment}</p>
                    </div>
                  </div>
                  <Button variant="outline" onClick={() => startEdit('apns')}>Edit</Button>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm text-slate-500 mb-3">No APNS credentials configured</p>
                  <Button onClick={() => startEdit('apns')} className="bg-slate-700 hover:bg-slate-800">
                    <Key className="w-4 h-4 mr-2" />
                    Add APNS Credentials
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
