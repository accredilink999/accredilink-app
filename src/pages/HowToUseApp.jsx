import React from 'react';
import PageHeader from '@/components/ui/PageHeader';
import AppHelpGuide from '@/components/profile/AppHelpGuide';

export default function HowToUseApp() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="How To Use The App" 
        subtitle="Complete guide to all features"
      />
      <AppHelpGuide />
    </div>
  );
}