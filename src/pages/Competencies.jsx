import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { ClipboardCheck } from 'lucide-react';
import StaffCompetencies from '@/components/profile/StaffCompetencies';

export default function Competencies() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Competencies"
        subtitle="Probationary & skills assessments completed with your mentor"
        icon={ClipboardCheck}
        className="[&_h1]:text-slate-900 [&_svg]:text-violet-600 [&_svg]:fill-violet-100"
      />
      <StaffCompetencies userId={user?.id} />
    </div>
  );
}
