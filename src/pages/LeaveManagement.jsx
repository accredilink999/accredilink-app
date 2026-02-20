import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import PageHeader from '@/components/ui/PageHeader';
import LeaveBalance from '@/components/leave/LeaveBalance';
import LeaveRequests from '@/components/leave/LeaveRequests';
import RequestLeave from '@/components/leave/RequestLeave';
import { Calendar, Phone, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function LeaveManagement() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('balance');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager'].includes(user?.job_title);

  // Fetch company sick phone number (admin setting)
  const { data: sickPhoneSettings = [] } = useQuery({
    queryKey: ['companySickPhone'],
    queryFn: () => base44.entities.SystemSettings.filter({ setting_key: 'company_sick_phone' }),
    enabled: isAdmin,
  });

  const existingSickPhone = sickPhoneSettings[0];
  const [sickPhone, setSickPhone] = useState('');
  const sickPhoneLoaded = React.useRef(false);

  // Sync fetched value into state once
  React.useEffect(() => {
    if (existingSickPhone && !sickPhoneLoaded.current) {
      setSickPhone(existingSickPhone.setting_value || '');
      sickPhoneLoaded.current = true;
    }
  }, [existingSickPhone]);

  const saveSickPhoneMutation = useMutation({
    mutationFn: async () => {
      if (existingSickPhone) {
        return base44.entities.SystemSettings.update(existingSickPhone.id, {
          setting_value: sickPhone.trim(),
        });
      } else {
        return base44.entities.SystemSettings.create({
          setting_key: 'company_sick_phone',
          setting_value: sickPhone.trim(),
          description: 'Company sick line phone number shown to staff when booking sick',
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companySickPhone'] });
      toast.success('Sick phone number saved');
    },
    onError: (error) => {
      toast.error('Failed: ' + error.message);
    },
  });

  const tabCount = isAdmin ? 4 : 3;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leave Management"
        subtitle="Manage holidays, sickness, and time off"
      >
        <Calendar className="w-6 h-6 text-teal-600" />
      </PageHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className={`grid w-full max-w-lg grid-cols-${tabCount}`}>
          <TabsTrigger value="balance">My Balance</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          {isAdmin && <TabsTrigger value="all-requests">All Requests</TabsTrigger>}
          {isAdmin && <TabsTrigger value="settings">Settings</TabsTrigger>}
        </TabsList>

        <TabsContent value="balance" className="mt-6">
          <LeaveBalance userId={user?.id} />
        </TabsContent>

        <TabsContent value="requests" className="mt-6">
          <div className="space-y-6">
            <RequestLeave userId={user?.id} userName={user?.full_name} />
            <LeaveRequests staffId={user?.id} isAdmin={false} />
          </div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="all-requests" className="mt-6">
            <LeaveRequests isAdmin={true} />
          </TabsContent>
        )}

        {isAdmin && (
          <TabsContent value="settings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-teal-600" />
                  Company Sick Line
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-500">
                  This phone number is shown to staff when they book sick leave, prompting them to call in immediately.
                </p>
                <div className="space-y-2">
                  <Label>Sick Line Phone Number</Label>
                  <Input
                    type="tel"
                    value={sickPhone}
                    onChange={(e) => setSickPhone(e.target.value)}
                    placeholder="e.g. 01745 123456"
                  />
                </div>
                <Button
                  onClick={() => saveSickPhoneMutation.mutate()}
                  disabled={saveSickPhoneMutation.isPending || !sickPhone.trim()}
                  className="bg-teal-600 hover:bg-teal-700"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveSickPhoneMutation.isPending ? 'Saving...' : 'Save Phone Number'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
