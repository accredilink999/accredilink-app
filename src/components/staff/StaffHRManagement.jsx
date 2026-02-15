import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DisciplinaryRecords from '@/components/hr/DisciplinaryRecords';
import SicknessManagement from '@/components/hr/SicknessManagement';
import HRDocuments from '@/components/hr/HRDocuments';
import QuickSicknessRecord from '@/components/hr/QuickSicknessRecord';
import QuickDisciplinaryRecord from '@/components/hr/QuickDisciplinaryRecord';
import { FileText, AlertCircle, Heart, Plus } from 'lucide-react';

export default function StaffHRManagement({ staffId, isAdmin, isOwnProfile }) {
  const [activeTab, setActiveTab] = useState('documents');
  const [showSicknessModal, setShowSicknessModal] = useState(false);
  const [showDisciplinaryModal, setShowDisciplinaryModal] = useState(false);

  const { data: staff } = useQuery({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      const allStaff = await base44.entities.User.list();
      return allStaff.find(s => s.id === staffId);
    },
  });

  return (
    <div className="space-y-6">
      {isAdmin && !isOwnProfile && (
        <div className="flex gap-2">
          <Button
            onClick={() => setShowSicknessModal(true)}
            size="sm"
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            Record Sickness
          </Button>
          <Button
            onClick={() => setShowDisciplinaryModal(true)}
            size="sm"
            variant="destructive"
          >
            <Plus className="w-4 h-4 mr-1" />
            Disciplinary
          </Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto gap-1">
          <TabsTrigger value="documents" className="text-xs sm:text-sm p-1 sm:p-2 h-8 sm:h-10 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Documents</span>
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="disciplinary" className="text-xs sm:text-sm p-1 sm:p-2 h-8 sm:h-10 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Disciplinary</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="sickness" className="text-xs sm:text-sm p-1 sm:p-2 h-8 sm:h-10 flex items-center gap-2">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Sickness</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="mt-6">
          <HRDocuments userId={staffId} isAdmin={isAdmin} />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="disciplinary" className="mt-6">
            <DisciplinaryRecords staffId={staffId} isAdmin={isAdmin} staffName={staff?.full_name} />
          </TabsContent>
        )}

        <TabsContent value="sickness" className="mt-6">
          <SicknessManagement userId={staffId} isAdmin={isAdmin} />
        </TabsContent>
      </Tabs>

      <QuickSicknessRecord 
        open={showSicknessModal} 
        onClose={() => setShowSicknessModal(false)}
        staffId={staffId}
      />
      <QuickDisciplinaryRecord 
        open={showDisciplinaryModal} 
        onClose={() => setShowDisciplinaryModal(false)}
        staffId={staffId}
      />
    </div>
  );
}