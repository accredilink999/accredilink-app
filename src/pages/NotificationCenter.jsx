import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import NotificationCenterComponent from '@/components/notifications/NotificationCenter';
import PageHeader from '@/components/ui/PageHeader';

export default function NotificationCenterPage() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  if (!user?.id) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Notification Center" 
        subtitle="View and manage all your notifications"
      />
      <NotificationCenterComponent userId={user.id} />
    </div>
  );
}