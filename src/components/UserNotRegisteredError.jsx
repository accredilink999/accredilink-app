import React from 'react';
import { AlertTriangle } from 'lucide-react';

import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';

export default function UserNotRegisteredError({ status = 'pending' }) {
  const isDenied = status === 'denied';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className={`w-16 h-16 ${isDenied ? 'bg-red-100' : 'bg-amber-100'} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <AlertTriangle className={`w-8 h-8 ${isDenied ? 'text-red-600' : 'text-amber-600'}`} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          {isDenied ? 'Account Access Denied' : 'Account Pending Approval'}
        </h1>
        <p className="text-slate-600 mb-6">
          {isDenied 
            ? 'Your account request has been denied. Please contact your administrator for more information.'
            : 'Your account is currently awaiting approval from an administrator. You will receive access once your account has been reviewed and approved.'
          }
        </p>
        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 mb-6">
          <p className="font-medium mb-1">What happens next?</p>
          <p>
            {isDenied
              ? 'Contact your system administrator if you believe this was a mistake.'
              : 'An administrator will review your request and approve your account shortly. You\'ll be notified via email once approved.'
            }
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => base44.auth.logout()}
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}