import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from '@/components/ui/PageHeader';
import StaffDocuments from '@/components/documents/StaffDocuments';
import AdminDocuments from '@/components/documents/AdminDocuments';
import DocumentRequirements from '@/components/documents/DocumentRequirements';
import CompanyDocuments from '@/components/documents/CompanyDocuments';
import { 
  FileText,
  Shield,
  Upload,
  ClipboardList
} from 'lucide-react';

export default function Documents() {
  const [activeTab, setActiveTab] = useState('my-documents');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin' || ['admin', 'manager', 'supervisor'].includes(user?.job_title);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        subtitle="Manage personal documents and company resources"
        tutorialKey="Documents"
      />

      <Card className="p-1 bg-gradient-to-br from-white to-slate-50 border-0 shadow-sm hover:shadow-md transition-shadow">
         <Tabs value={activeTab} onValueChange={setActiveTab}>
           <TabsList className="w-full grid grid-cols-2 lg:grid-cols-4 h-auto p-1 bg-gradient-to-r from-slate-100 to-slate-200">
            <TabsTrigger value="my-documents" className="gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">My Documents</span>
              <span className="sm:hidden">Mine</span>
            </TabsTrigger>
            <TabsTrigger value="company" className="gap-2">
              <ClipboardList className="w-4 h-4" />
              <span className="hidden sm:inline">Company</span>
              <span className="sm:hidden">Company</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="all-staff" className="gap-2">
                  <Shield className="w-4 h-4" />
                  <span className="hidden sm:inline">All Staff</span>
                  <span className="sm:hidden">Staff</span>
                </TabsTrigger>
                <TabsTrigger value="requirements" className="gap-2">
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Requirements</span>
                  <span className="sm:hidden">Required</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="my-documents">
              <StaffDocuments user={user} />
            </TabsContent>

            <TabsContent value="company">
              <CompanyDocuments user={user} isAdmin={isAdmin} />
            </TabsContent>

            {isAdmin && (
              <>
                <TabsContent value="all-staff">
                  <AdminDocuments user={user} />
                </TabsContent>

                <TabsContent value="requirements">
                  <DocumentRequirements user={user} />
                </TabsContent>
              </>
            )}
          </div>
        </Tabs>
      </Card>
    </div>
  );
}