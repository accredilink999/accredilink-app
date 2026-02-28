import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/ui/PageHeader';
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  AlertTriangle,
  Bandage,
  PersonStanding,
  ClipboardList,
  Weight,
  TrendingDown,
  Clock,
  ChevronRight,
  Loader2,
} from 'lucide-react';

const riskBadge = (level) => {
  const map = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-amber-100 text-amber-700',
    high: 'bg-red-100 text-red-700',
    very_high: 'bg-red-200 text-red-800',
  };
  return map[level] || 'bg-slate-100 text-slate-600';
};

const riskLabel = (level) => {
  const map = { low: 'Low', medium: 'Medium', high: 'High', very_high: 'Very High' };
  return map[level] || level;
};

function StatCard({ title, value, subtitle, icon: Icon, color = 'rose', alert = false }) {
  return (
    <Card className={`p-4 ${alert ? 'border-red-300 bg-red-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase">{title}</p>
          <p className={`text-2xl font-bold ${alert ? 'text-red-700' : `text-${color}-700`}`}>{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 ${alert ? 'bg-red-100' : `bg-${color}-100`} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${alert ? 'text-red-600' : `text-${color}-600`}`} />
        </div>
      </div>
    </Card>
  );
}

export default function ClinicalDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: serviceUsers = [] } = useQuery({
    queryKey: ['serviceUsers'],
    queryFn: () => base44.entities.ServiceUser.filter({ status: 'active' }, 'full_name', 500),
  });

  const { data: assessments = [], isLoading: assessLoading } = useQuery({
    queryKey: ['allAssessments'],
    queryFn: () => base44.entities.Assessment.list('-assessment_date', 1000),
  });

  const { data: wounds = [], isLoading: woundsLoading } = useQuery({
    queryKey: ['allWounds'],
    queryFn: () => base44.entities.WoundRecord.list('-recorded_at', 500),
  });

  const { data: falls = [], isLoading: fallsLoading } = useQuery({
    queryKey: ['allFalls'],
    queryFn: () => base44.entities.FallsRecord.list('-fall_date', 500),
  });

  const { data: observations = [] } = useQuery({
    queryKey: ['allObservations'],
    queryFn: () => base44.entities.ClinicalObservation.list('-recorded_at', 1000),
  });

  const isLoading = assessLoading || woundsLoading || fallsLoading;

  // Stats calculations
  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const thisMonth = today.slice(0, 7);
    const lastMonth = new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7);

    // Overdue assessments
    const latestByUserAndType = {};
    assessments.forEach(a => {
      const key = `${a.service_user_id}_${a.assessment_type}`;
      if (!latestByUserAndType[key] || a.assessment_date > latestByUserAndType[key].assessment_date) {
        latestByUserAndType[key] = a;
      }
    });
    const overdueAssessments = Object.values(latestByUserAndType).filter(
      a => a.next_review_date && a.next_review_date < today
    );

    // Active wounds
    const activeWounds = wounds.filter(w => w.status === 'active' || w.status === 'healing');
    const overdueDressings = activeWounds.filter(w => w.next_dressing_date && w.next_dressing_date < today);

    // Falls this month vs last
    const fallsThisMonth = falls.filter(f => f.fall_date?.startsWith(thisMonth));
    const fallsLastMonth = falls.filter(f => f.fall_date?.startsWith(lastMonth));

    // Weight loss alerts — check for >5% drop in weight observations
    const weightObs = observations.filter(o => o.observation_type === 'weight' && o.value_numeric);
    const weightByUser = {};
    weightObs.forEach(o => {
      if (!weightByUser[o.service_user_id]) weightByUser[o.service_user_id] = [];
      weightByUser[o.service_user_id].push(o);
    });
    let weightAlerts = 0;
    Object.values(weightByUser).forEach(records => {
      records.sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at));
      if (records.length >= 2) {
        const latest = records[0].value_numeric;
        const threeMonthsAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const older = records.find(r => new Date(r.recorded_at) < threeMonthsAgo);
        if (older && older.value_numeric > 0) {
          const pctChange = ((older.value_numeric - latest) / older.value_numeric) * 100;
          if (pctChange > 5) weightAlerts++;
        }
      }
    });

    return {
      overdueAssessments,
      activeWounds,
      overdueDressings,
      fallsThisMonth,
      fallsLastMonth,
      weightAlerts,
    };
  }, [assessments, wounds, falls, observations]);

  // Latest assessments grouped by client
  const assessmentsByClient = useMemo(() => {
    const map = {};
    assessments.forEach(a => {
      if (!map[a.service_user_id]) map[a.service_user_id] = { name: a.service_user_name, assessments: {} };
      const existing = map[a.service_user_id].assessments[a.assessment_type];
      if (!existing || a.assessment_date > existing.assessment_date) {
        map[a.service_user_id].assessments[a.assessment_type] = a;
      }
    });
    return Object.entries(map).map(([id, data]) => ({ id, ...data }));
  }, [assessments]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto pb-6">
        <PageHeader title="Clinical Dashboard" icon={Activity} />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-6">
      <PageHeader title="Clinical Dashboard" icon={Activity} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          title="Overdue Assessments"
          value={stats.overdueAssessments.length}
          subtitle={`${Object.keys(assessmentsByClient).length} clients assessed`}
          icon={ClipboardList}
          alert={stats.overdueAssessments.length > 0}
        />
        <StatCard
          title="Active Wounds"
          value={stats.activeWounds.length}
          subtitle={stats.overdueDressings.length > 0 ? `${stats.overdueDressings.length} overdue dressings` : 'All dressings on schedule'}
          icon={Bandage}
          color="amber"
          alert={stats.overdueDressings.length > 0}
        />
        <StatCard
          title="Falls This Month"
          value={stats.fallsThisMonth.length}
          subtitle={`Last month: ${stats.fallsLastMonth.length}`}
          icon={PersonStanding}
          color="orange"
          alert={stats.fallsThisMonth.length > stats.fallsLastMonth.length}
        />
        <StatCard
          title="Weight Loss Alerts"
          value={stats.weightAlerts}
          subtitle=">5% loss in 3 months"
          icon={TrendingDown}
          color="purple"
          alert={stats.weightAlerts > 0}
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-200 w-full justify-start mb-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="wounds">Wounds</TabsTrigger>
          <TabsTrigger value="falls">Falls</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Overdue Assessments */}
          {stats.overdueAssessments.length > 0 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="font-semibold text-red-800 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Overdue Assessments ({stats.overdueAssessments.length})
              </h3>
              <div className="space-y-2">
                {stats.overdueAssessments.slice(0, 10).map(a => (
                  <div key={a.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-red-100">
                    <div>
                      <span className="text-sm font-medium text-slate-900">{a.service_user_name || 'Unknown'}</span>
                      <span className="text-xs text-slate-500 ml-2 capitalize">{a.assessment_type?.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-red-600">Due: {a.next_review_date}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Overdue Dressings */}
          {stats.overdueDressings.length > 0 && (
            <Card className="p-4 border-amber-200 bg-amber-50">
              <h3 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
                <Bandage className="w-4 h-4" />
                Overdue Dressings ({stats.overdueDressings.length})
              </h3>
              <div className="space-y-2">
                {stats.overdueDressings.map(w => {
                  const su = serviceUsers.find(s => s.id === w.service_user_id);
                  return (
                    <div key={w.id} className="flex items-center justify-between bg-white rounded-lg p-2 border border-amber-100">
                      <div>
                        <span className="text-sm font-medium text-slate-900">{su?.full_name || 'Unknown'}</span>
                        <span className="text-xs text-slate-500 ml-2 capitalize">{w.wound_type?.replace(/_/g, ' ')} — {w.location_body?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="text-xs text-amber-700">Due: {w.next_dressing_date}</div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Recent Falls */}
          {stats.fallsThisMonth.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <PersonStanding className="w-4 h-4 text-orange-600" />
                Falls This Month ({stats.fallsThisMonth.length})
              </h3>
              <div className="space-y-2">
                {stats.fallsThisMonth.map(f => {
                  const su = serviceUsers.find(s => s.id === f.service_user_id);
                  return (
                    <div key={f.id} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                      <div>
                        <span className="text-sm font-medium text-slate-900">{su?.full_name || f.staff_name || 'Unknown'}</span>
                        <span className="text-xs text-slate-500 ml-2 capitalize">{f.location?.replace(/_/g, ' ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={f.injuries === 'none' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                          {f.injuries?.replace(/_/g, ' ') || 'Unknown'}
                        </Badge>
                        <span className="text-xs text-slate-500">{f.fall_date}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {stats.overdueAssessments.length === 0 && stats.overdueDressings.length === 0 && stats.fallsThisMonth.length === 0 && (
            <Card className="p-8 text-center">
              <Activity className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">All clear</h3>
              <p className="text-sm text-slate-500">No overdue assessments, dressings or falls this month.</p>
            </Card>
          )}
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-3">
          {assessmentsByClient.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardList className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No clinical assessments recorded yet.</p>
            </Card>
          ) : (
            assessmentsByClient.map(client => (
              <Card key={client.id} className="p-4">
                <h4 className="font-semibold text-slate-900 mb-3">{client.name || 'Unknown Client'}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                  {['waterlow', 'must', 'falls_risk', 'abbey_pain', 'barthel'].map(type => {
                    const a = client.assessments[type];
                    const today = new Date().toISOString().split('T')[0];
                    const overdue = a?.next_review_date && a.next_review_date < today;
                    return (
                      <div key={type} className={`rounded-lg p-2 border ${overdue ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="text-[10px] font-medium text-slate-500 uppercase mb-1">{type.replace(/_/g, ' ')}</p>
                        {a ? (
                          <>
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-bold text-slate-900">{a.score}</span>
                              <Badge className={`text-[10px] px-1.5 py-0 ${riskBadge(a.risk_level)}`}>
                                {riskLabel(a.risk_level)}
                              </Badge>
                            </div>
                            <p className="text-[10px] text-slate-500">{a.assessment_date}</p>
                            {overdue && <p className="text-[10px] text-red-600 font-medium">Review overdue</p>}
                          </>
                        ) : (
                          <p className="text-xs text-slate-400">Not assessed</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Wounds Tab */}
        <TabsContent value="wounds" className="space-y-3">
          {stats.activeWounds.length === 0 ? (
            <Card className="p-8 text-center">
              <Bandage className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No active wounds across any clients.</p>
            </Card>
          ) : (
            stats.activeWounds.map(w => {
              const su = serviceUsers.find(s => s.id === w.service_user_id);
              const today = new Date().toISOString().split('T')[0];
              const overdue = w.next_dressing_date && w.next_dressing_date < today;
              return (
                <Card key={w.id} className={`p-4 ${overdue ? 'border-amber-200' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{su?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-slate-600 capitalize">
                        {w.wound_type?.replace(/_/g, ' ')} — {w.location_body?.replace(/_/g, ' ')}
                        {w.grade && <span className="ml-1 text-slate-500">({w.grade.replace(/_/g, ' ')})</span>}
                      </p>
                      {w.length_cm && w.width_cm && (
                        <p className="text-xs text-slate-500">{w.length_cm}cm × {w.width_cm}cm</p>
                      )}
                    </div>
                    <div className="text-right">
                      <Badge className={w.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}>
                        {w.status}
                      </Badge>
                      {w.next_dressing_date && (
                        <p className={`text-xs mt-1 ${overdue ? 'text-red-600 font-medium' : 'text-slate-500'}`}>
                          Next dressing: {w.next_dressing_date}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* Falls Tab */}
        <TabsContent value="falls" className="space-y-3">
          {falls.length === 0 ? (
            <Card className="p-8 text-center">
              <PersonStanding className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">No falls recorded across any clients.</p>
            </Card>
          ) : (
            <>
              {/* Falls summary by client */}
              {(() => {
                const fallsByClient = {};
                falls.forEach(f => {
                  if (!fallsByClient[f.service_user_id]) fallsByClient[f.service_user_id] = [];
                  fallsByClient[f.service_user_id].push(f);
                });
                return Object.entries(fallsByClient)
                  .sort((a, b) => b[1].length - a[1].length)
                  .map(([suId, clientFalls]) => {
                    const su = serviceUsers.find(s => s.id === suId);
                    const thisMonth = new Date().toISOString().slice(0, 7);
                    const thisMonthCount = clientFalls.filter(f => f.fall_date?.startsWith(thisMonth)).length;
                    return (
                      <Card key={suId} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{su?.full_name || 'Unknown'}</h4>
                          <div className="flex gap-2">
                            <Badge className="bg-slate-100 text-slate-700">{clientFalls.length} total</Badge>
                            {thisMonthCount > 0 && (
                              <Badge className="bg-orange-100 text-orange-700">{thisMonthCount} this month</Badge>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {clientFalls.slice(0, 5).map(f => (
                            <div key={f.id} className="flex items-center justify-between text-sm bg-slate-50 rounded p-2">
                              <span className="text-slate-700">{f.fall_date} {f.fall_time?.slice(0, 5) || ''}</span>
                              <span className="text-slate-500 capitalize">{f.location?.replace(/_/g, ' ')}</span>
                              <Badge className={f.injuries === 'none' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                {f.injuries?.replace(/_/g, ' ') || 'unknown'}
                              </Badge>
                            </div>
                          ))}
                          {clientFalls.length > 5 && (
                            <p className="text-xs text-slate-400 text-center pt-1">+ {clientFalls.length - 5} more</p>
                          )}
                        </div>
                      </Card>
                    );
                  });
              })()}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
