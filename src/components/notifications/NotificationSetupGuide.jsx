import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Apple, PlayCircle, Bell, CheckCircle2 } from 'lucide-react';

export default function NotificationSetupGuide() {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-600" />
          Native Push Notification Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Apple className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900">iOS Setup (Apple Push Notification Service)</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-700 ml-7">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Open Settings → [App Name] → Notifications</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Enable "Allow Notifications"</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Choose alert style: Banners or Alerts</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Enable Sounds, Badges, and Lock Screen notifications</p>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-3">
            <PlayCircle className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Android Setup (Firebase Cloud Messaging)</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-700 ml-7">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Open Settings → Apps → [App Name] → Notifications</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Toggle "Show notifications" ON</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Configure notification channels (General, Urgent, etc.)</p>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <p>Enable sound, vibration, and pop-up notifications</p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            Requirements for App Store Submission:
          </h4>
          <ul className="text-sm text-slate-700 space-y-1 ml-6 list-disc">
            <li>Users must opt-in to push notifications (not automatic)</li>
            <li>Notification sounds must be under 30 seconds</li>
            <li>Must respect "Do Not Disturb" mode</li>
            <li>Must provide opt-out mechanism in app settings</li>
            <li>Must disclose notification usage in privacy policy</li>
            <li>Cannot send marketing notifications without explicit consent</li>
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900">
            <strong>Note:</strong> This system is production-ready for native iOS and Android apps. 
            The backend infrastructure supports both APNS and FCM. You'll need to configure your 
            APNS certificates and Firebase project credentials in the environment variables.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}