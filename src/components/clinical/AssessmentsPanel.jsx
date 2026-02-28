import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from 'sonner';
import {
  ClipboardList, Plus, ChevronDown, ChevronUp, Calendar, AlertTriangle,
  Activity, Scale, Footprints, Frown, Accessibility, MessageCircle, Thermometer
} from 'lucide-react';

import WaterlowAssessment from './assessments/WaterlowAssessment';
import MUSTAssessment from './assessments/MUSTAssessment';
import FallsRiskAssessment from './assessments/FallsRiskAssessment';
import AbbeyPainScale from './assessments/AbbeyPainScale';
import BarthelIndex from './assessments/BarthelIndex';
import SALTAssessment from './assessments/SALTAssessment';
import NEWS2Assessment from './assessments/NEWS2Assessment';

const ASSESSMENT_TYPES = [
  { key: 'waterlow', label: 'Waterlow Pressure Sore', icon: AlertTriangle, description: 'Pressure sore risk assessment', component: WaterlowAssessment },
  { key: 'must', label: 'MUST Nutritional', icon: Scale, description: 'Malnutrition Universal Screening Tool', component: MUSTAssessment },
  { key: 'falls_risk', label: 'Falls Risk', icon: Footprints, description: 'Multifactorial falls risk assessment', component: FallsRiskAssessment },
  { key: 'abbey_pain', label: 'Abbey Pain Scale', icon: Frown, description: 'Pain assessment for non-verbal clients', component: AbbeyPainScale },
  { key: 'barthel', label: 'Barthel Index', icon: Accessibility, description: 'Activities of daily living assessment', component: BarthelIndex },
  { key: 'salt', label: 'SALT', icon: MessageCircle, description: 'Speech & Language Therapy — swallowing & communication', component: SALTAssessment },
  { key: 'news2', label: 'NEWS2', icon: Thermometer, description: 'National Early Warning Score — acute illness detection', component: NEWS2Assessment },
];

const RISK_STYLES = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-red-100 text-red-700 border-red-200',
  very_high: 'bg-red-200 text-red-800 border-red-300',
};

const RISK_LABELS = {
  low: 'Low Risk',
  medium: 'Medium Risk',
  high: 'High Risk',
  very_high: 'Very High Risk',
};

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function isOverdue(dateStr) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

export default function AssessmentsPanel({ serviceUser }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [expandedTypes, setExpandedTypes] = useState({});

  const { data: assessments = [], isLoading } = useQuery({
    queryKey: ['assessments', serviceUser?.id],
    queryFn: () => base44.entities.Assessment.filter({ service_user_id: serviceUser.id }, '-assessment_date', 100),
    enabled: !!serviceUser?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Assessment.create({
      ...data,
      service_user_id: serviceUser.id,
      service_user_name: serviceUser.full_name,
      assessment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', serviceUser.id] });
      toast.success('Assessment saved successfully');
      setShowForm(false);
      setSelectedType(null);
      setEditingAssessment(null);
    },
    onError: (err) => {
      toast.error('Failed to save assessment: ' + (err.message || 'Unknown error'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => base44.entities.Assessment.update(id, {
      ...data,
      assessment_date: new Date().toISOString().split('T')[0],
      status: 'completed',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessments', serviceUser.id] });
      toast.success('Assessment updated successfully');
      setShowForm(false);
      setSelectedType(null);
      setEditingAssessment(null);
    },
    onError: (err) => {
      toast.error('Failed to update assessment: ' + (err.message || 'Unknown error'));
    },
  });

  // Group assessments by type and get latest for each
  const assessmentsByType = useMemo(() => {
    const grouped = {};
    for (const type of ASSESSMENT_TYPES) {
      const typeAssessments = assessments.filter(a => a.assessment_type === type.key);
      grouped[type.key] = {
        all: typeAssessments,
        latest: typeAssessments[0] || null, // already sorted by -assessment_date
      };
    }
    return grouped;
  }, [assessments]);

  const toggleExpanded = (typeKey) => {
    setExpandedTypes(prev => ({ ...prev, [typeKey]: !prev[typeKey] }));
  };

  const handleStartAssessment = (typeKey, existing = null) => {
    setSelectedType(typeKey);
    setEditingAssessment(existing);
    setShowForm(true);
  };

  const handleSave = (data) => {
    if (editingAssessment) {
      updateMutation.mutate({ id: editingAssessment.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleCloseDialog = () => {
    setShowForm(false);
    setSelectedType(null);
    setEditingAssessment(null);
  };

  const ActiveFormComponent = selectedType
    ? ASSESSMENT_TYPES.find(t => t.key === selectedType)?.component
    : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
          <ClipboardList className="w-4 h-4" />
          Clinical Assessments
        </h3>
        <Button
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-8"
          onClick={() => setShowForm(true)}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          New Assessment
        </Button>
      </div>

      {/* Assessment Type Cards */}
      {ASSESSMENT_TYPES.map((type) => {
        const { latest, all } = assessmentsByType[type.key];
        const Icon = type.icon;
        const isExpanded = expandedTypes[type.key];
        const historyItems = all.slice(1); // exclude latest

        return (
          <Card key={type.key} className="overflow-hidden">
            {/* Main card content */}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className={`p-1.5 rounded-lg shrink-0 ${latest ? (RISK_STYLES[latest.risk_level]?.split(' ')[0] || 'bg-slate-100') : 'bg-slate-100'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 leading-tight">{type.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{type.description}</p>

                    {latest ? (
                      <div className="mt-2 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={`text-[10px] px-1.5 py-0 border ${RISK_STYLES[latest.risk_level] || 'bg-slate-100 text-slate-600'}`}>
                            {RISK_LABELS[latest.risk_level] || latest.risk_level}
                          </Badge>
                          <span className="text-xs text-slate-600 font-medium">Score: {latest.score}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Assessed: {formatDate(latest.assessment_date)}
                          </span>
                          {latest.next_review_date && (
                            <span className={`flex items-center gap-1 ${isOverdue(latest.next_review_date) ? 'text-red-600 font-medium' : ''}`}>
                              <Calendar className="w-3 h-3" />
                              Review: {formatDate(latest.next_review_date)}
                              {isOverdue(latest.next_review_date) && ' (OVERDUE)'}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 mt-1.5 italic">Not assessed</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  <Button
                    size="sm"
                    variant={latest ? "outline" : "default"}
                    className={`text-[11px] h-7 px-2 ${!latest ? 'bg-rose-600 hover:bg-rose-700 text-white' : ''}`}
                    onClick={() => handleStartAssessment(type.key)}
                  >
                    {latest ? 'Reassess' : 'Start'}
                  </Button>
                  {historyItems.length > 0 && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-[11px] h-6 px-2 text-slate-500"
                      onClick={() => toggleExpanded(type.key)}
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3 mr-0.5" /> : <ChevronDown className="w-3 h-3 mr-0.5" />}
                      {historyItems.length} prior
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Expanded history */}
            {isExpanded && historyItems.length > 0 && (
              <div className="border-t bg-slate-50 px-3 py-2 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Assessment History</p>
                {historyItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between bg-white rounded-md px-2.5 py-1.5 border border-slate-100 cursor-pointer hover:border-slate-200 transition-colors"
                    onClick={() => handleStartAssessment(type.key, item)}
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={`text-[10px] px-1.5 py-0 border ${RISK_STYLES[item.risk_level] || 'bg-slate-100 text-slate-600'}`}>
                        {RISK_LABELS[item.risk_level] || item.risk_level}
                      </Badge>
                      <span className="text-xs text-slate-600">Score: {item.score}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{formatDate(item.assessment_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        );
      })}

      {/* Assessment Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedType
                ? `${editingAssessment ? 'Review' : 'New'} ${ASSESSMENT_TYPES.find(t => t.key === selectedType)?.label} Assessment`
                : 'Select Assessment Type'
              }
            </DialogTitle>
          </DialogHeader>

          {!selectedType ? (
            // Type selector
            <div className="grid gap-2 py-2">
              {ASSESSMENT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.key}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-colors text-left"
                    onClick={() => setSelectedType(type.key)}
                  >
                    <div className="p-2 bg-rose-100 rounded-lg">
                      <Icon className="w-5 h-5 text-rose-700" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{type.label}</p>
                      <p className="text-xs text-slate-500">{type.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : ActiveFormComponent ? (
            <ActiveFormComponent
              serviceUser={serviceUser}
              onSave={handleSave}
              onCancel={handleCloseDialog}
              existingAssessment={editingAssessment}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
