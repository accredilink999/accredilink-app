import React, { useState } from 'react';
import { ClipboardList, Activity, Bandage, PersonStanding, RotateCcw, Droplets, ChevronLeft } from 'lucide-react';
import AssessmentsPanel from './AssessmentsPanel';
import ObservationsPanel from './ObservationsPanel';
import WoundsPanel from './WoundsPanel';
import FallsPanel from './FallsPanel';
import RepositioningPanel from './RepositioningPanel';
import ContinencePanel from './ContinencePanel';

const SECTIONS = [
  { value: 'assessments', label: 'Assessments', icon: ClipboardList, bg: 'from-rose-400 to-rose-600', desc: 'Waterlow, MUST, NEWS2, Falls Risk & more' },
  { value: 'observations', label: 'Observations', icon: Activity, bg: 'from-violet-400 to-violet-600', desc: 'Weight, BP, temp, pulse, O2, blood sugar' },
  { value: 'wounds', label: 'Wounds', icon: Bandage, bg: 'from-amber-400 to-amber-600', desc: 'Wound tracking, dressings & healing progress' },
  { value: 'falls', label: 'Falls', icon: PersonStanding, bg: 'from-red-400 to-red-600', desc: 'Falls recording, patterns & risk factors' },
  { value: 'repositioning', label: 'Repositioning', icon: RotateCcw, bg: 'from-blue-400 to-blue-600', desc: 'Position chart, 4-hour gap detection' },
  { value: 'continence', label: 'Continence', icon: Droplets, bg: 'from-teal-400 to-teal-600', desc: 'Pad checks, toileting & bowel records' },
];

export default function ClinicalPanel({ serviceUser }) {
  const [activeSection, setActiveSection] = useState(null);

  // Render the active sub-panel
  if (activeSection) {
    const section = SECTIONS.find(s => s.value === activeSection);
    const Icon = section?.icon;

    return (
      <div>
        <button
          onClick={() => setActiveSection(null)}
          className="flex items-center gap-1.5 text-sm font-medium text-rose-700 hover:text-rose-900 mb-4 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Clinical
        </button>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center shadow-sm`}>
            <Icon className="w-5 h-5 text-white" strokeWidth={1.8} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">{section.label}</h3>
            <p className="text-xs text-slate-500">{section.desc}</p>
          </div>
        </div>

        {activeSection === 'assessments' && <AssessmentsPanel serviceUser={serviceUser} />}
        {activeSection === 'observations' && <ObservationsPanel serviceUser={serviceUser} />}
        {activeSection === 'wounds' && <WoundsPanel serviceUser={serviceUser} />}
        {activeSection === 'falls' && <FallsPanel serviceUser={serviceUser} />}
        {activeSection === 'repositioning' && <RepositioningPanel serviceUser={serviceUser} />}
        {activeSection === 'continence' && <ContinencePanel serviceUser={serviceUser} />}
      </div>
    );
  }

  // Grid of clickable icon tiles
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {SECTIONS.map(section => {
        const Icon = section.icon;
        return (
          <button
            key={section.value}
            onClick={() => setActiveSection(section.value)}
            className="flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-all p-4 sm:p-5 min-h-[110px] active:scale-95"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.bg} flex items-center justify-center mb-2 shadow-sm`}>
              <Icon className="w-6 h-6 text-white" strokeWidth={1.8} />
            </div>
            <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
              {section.label}
            </span>
            <span className="text-[10px] text-slate-400 text-center mt-1 leading-tight line-clamp-2">
              {section.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
