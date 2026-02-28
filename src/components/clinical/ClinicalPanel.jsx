import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardList, Activity, Bandage, PersonStanding, RotateCcw, Droplets } from 'lucide-react';
import AssessmentsPanel from './AssessmentsPanel';
import ObservationsPanel from './ObservationsPanel';
import WoundsPanel from './WoundsPanel';
import FallsPanel from './FallsPanel';
import RepositioningPanel from './RepositioningPanel';
import ContinencePanel from './ContinencePanel';

const subTabStyle = "text-xs font-semibold rounded-lg py-1.5 px-2 data-[state=active]:bg-rose-100 data-[state=active]:text-rose-800 data-[state=active]:border data-[state=active]:border-rose-200 data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:bg-slate-50 transition-all";

export default function ClinicalPanel({ serviceUser }) {
  return (
    <div>
      <Tabs defaultValue="assessments" className="w-full">
        <TabsList className="flex flex-wrap gap-1 h-auto bg-transparent p-0 mb-4">
          <TabsTrigger value="assessments" className={subTabStyle}>
            <ClipboardList className="w-3 h-3 mr-1 inline" /> Assessments
          </TabsTrigger>
          <TabsTrigger value="observations" className={subTabStyle}>
            <Activity className="w-3 h-3 mr-1 inline" /> Observations
          </TabsTrigger>
          <TabsTrigger value="wounds" className={subTabStyle}>
            <Bandage className="w-3 h-3 mr-1 inline" /> Wounds
          </TabsTrigger>
          <TabsTrigger value="falls" className={subTabStyle}>
            <PersonStanding className="w-3 h-3 mr-1 inline" /> Falls
          </TabsTrigger>
          <TabsTrigger value="repositioning" className={subTabStyle}>
            <RotateCcw className="w-3 h-3 mr-1 inline" /> Repositioning
          </TabsTrigger>
          <TabsTrigger value="continence" className={subTabStyle}>
            <Droplets className="w-3 h-3 mr-1 inline" /> Continence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="assessments">
          <AssessmentsPanel serviceUser={serviceUser} />
        </TabsContent>
        <TabsContent value="observations">
          <ObservationsPanel serviceUser={serviceUser} />
        </TabsContent>
        <TabsContent value="wounds">
          <WoundsPanel serviceUser={serviceUser} />
        </TabsContent>
        <TabsContent value="falls">
          <FallsPanel serviceUser={serviceUser} />
        </TabsContent>
        <TabsContent value="repositioning">
          <RepositioningPanel serviceUser={serviceUser} />
        </TabsContent>
        <TabsContent value="continence">
          <ContinencePanel serviceUser={serviceUser} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
