/**
 * Virtual Care Inspection Engine
 *
 * Runs automated compliance checks against all system data,
 * mirroring what CIW / CQC inspectors look for during real inspections.
 *
 * Each check returns findings: { passed, failed, warnings }
 * with items containing { id, name, detail, regulation }.
 */

import { differenceInDays, differenceInCalendarDays, subDays, format } from 'date-fns';

// ── Severity levels ──────────────────────────────────────────────────────────
export const SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  WARNING: 'warning',
};

export const SEVERITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  warning: 'Warning',
};

export const SEVERITY_COLORS = {
  critical: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', dot: 'bg-red-500' },
  high: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', dot: 'bg-orange-500' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', dot: 'bg-yellow-500' },
  warning: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300', dot: 'bg-blue-500' },
};

// ── Category definitions ─────────────────────────────────────────────────────
export const INSPECTION_CATEGORIES = {
  staff_compliance: {
    key: 'staff_compliance',
    label: 'Staff Compliance',
    description: 'DBS checks, right to work, contracts, emergency contacts',
    icon: 'Users',
    weight: 0.20,
    ciwRegs: ['Reg 29', 'Reg 57'],
    cqcRegs: ['Reg 19', 'Reg 17'],
  },
  supervision: {
    key: 'supervision',
    label: 'Supervision & Appraisals',
    description: '12-weekly supervisions, annual appraisals',
    icon: 'ClipboardCheck',
    weight: 0.15,
    ciwRegs: ['Reg 36'],
    cqcRegs: ['Reg 18'],
  },
  training: {
    key: 'training',
    label: 'Training & Development',
    description: 'Mandatory training, certificates, induction',
    icon: 'GraduationCap',
    weight: 0.15,
    ciwRegs: ['Reg 34', 'Reg 35'],
    cqcRegs: ['Reg 18'],
  },
  service_users: {
    key: 'service_users',
    label: 'Service User Records',
    description: 'Care plans, reviews, assessments, consent, contacts',
    icon: 'Heart',
    weight: 0.20,
    ciwRegs: ['Reg 21', 'Reg 22'],
    cqcRegs: ['Reg 9', 'Reg 11', 'Reg 12'],
  },
  medication: {
    key: 'medication',
    label: 'Medication Management',
    description: 'MAR charts, missed doses, medication records',
    icon: 'Pill',
    weight: 0.15,
    ciwRegs: ['Reg 26'],
    cqcRegs: ['Reg 12'],
  },
  care_delivery: {
    key: 'care_delivery',
    label: 'Care Delivery & Logs',
    description: 'Care logs, shift coverage, visit records',
    icon: 'FileText',
    weight: 0.05,
    ciwRegs: ['Reg 57', 'Reg 28'],
    cqcRegs: ['Reg 17', 'Reg 18'],
  },
  incidents: {
    key: 'incidents',
    label: 'Incidents & Safeguarding',
    description: 'Incident reports, safeguarding referrals, follow-ups',
    icon: 'AlertTriangle',
    weight: 0.05,
    ciwRegs: ['Reg 60', 'Reg 77'],
    cqcRegs: ['Reg 13', 'Reg 17'],
  },
  governance: {
    key: 'governance',
    label: 'Governance & Quality',
    description: 'RI visits, quality reviews, audits, complaints',
    icon: 'Shield',
    weight: 0.05,
    ciwRegs: ['Reg 73', 'Reg 80'],
    cqcRegs: ['Reg 17'],
  },
};

// ── Helper functions ─────────────────────────────────────────────────────────

const today = () => new Date();
const daysSince = (dateStr) => {
  if (!dateStr) return Infinity;
  return differenceInCalendarDays(today(), new Date(dateStr));
};

// ── Check definitions ────────────────────────────────────────────────────────

function staffComplianceChecks(data, framework) {
  const { staff, hrDocuments } = data;
  const activeStaff = staff.filter(s => s.is_active !== false);
  const findings = [];

  for (const s of activeStaff) {
    const name = s.name || s.full_name || s.email || 'Unknown';
    const staffDocs = hrDocuments.filter(d => d.staff_id === s.id || d.user_id === s.id);

    // Check DBS — look in HR documents for DBS type
    const dbsDocs = staffDocs.filter(d =>
      d.document_type?.toLowerCase().includes('dbs') ||
      d.title?.toLowerCase().includes('dbs') ||
      d.category?.toLowerCase().includes('dbs')
    );
    const latestDbs = dbsDocs.sort((a, b) => (b.issue_date || b.expiry_date || '') > (a.issue_date || a.expiry_date || '') ? 1 : -1)[0];

    if (!latestDbs && !s.dbs_date) {
      findings.push({
        category: 'staff_compliance',
        severity: SEVERITY.CRITICAL,
        checkId: 'STAFF_001',
        title: 'Missing DBS check',
        detail: `${name} has no DBS check on record`,
        staffId: s.id,
        staffName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 29' : 'CQC Reg 19',
      });
    } else {
      // Check DBS expiry (3 years)
      const dbsDate = latestDbs?.issue_date || latestDbs?.expiry_date || s.dbs_date;
      if (dbsDate) {
        const daysOld = daysSince(dbsDate);
        if (daysOld > 1095) { // 3 years
          findings.push({
            category: 'staff_compliance',
            severity: SEVERITY.HIGH,
            checkId: 'STAFF_002',
            title: 'Expired DBS check',
            detail: `${name} — DBS is ${Math.floor(daysOld / 365)} years old (dated ${dbsDate}). Renewal recommended every 3 years.`,
            staffId: s.id,
            staffName: name,
            regulation: framework === 'ciw' ? 'CIW Reg 29' : 'CQC Reg 19',
          });
        } else if (daysOld > 1005) { // Within 90 days of expiry
          findings.push({
            category: 'staff_compliance',
            severity: SEVERITY.WARNING,
            checkId: 'STAFF_004',
            title: 'DBS expiring soon',
            detail: `${name} — DBS will be 3 years old in ${1095 - daysOld} days`,
            staffId: s.id,
            staffName: name,
            regulation: framework === 'ciw' ? 'CIW Reg 29' : 'CQC Reg 19',
          });
        }
      }
    }

    // No start date
    if (!s.start_date) {
      findings.push({
        category: 'staff_compliance',
        severity: SEVERITY.MEDIUM,
        checkId: 'STAFF_005',
        title: 'No start date recorded',
        detail: `${name} has no employment start date on record`,
        staffId: s.id,
        staffName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 57' : 'CQC Reg 17',
      });
    }

    // Missing emergency contact
    if (!s.emergency_contact && !s.emergency_contact_name) {
      findings.push({
        category: 'staff_compliance',
        severity: SEVERITY.MEDIUM,
        checkId: 'STAFF_007',
        title: 'Missing emergency contact',
        detail: `${name} has no emergency contact recorded`,
        staffId: s.id,
        staffName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 57' : 'CQC Reg 17',
      });
    }
  }

  return findings;
}

function supervisionChecks(data) {
  const { staff, supervisions } = data;
  const activeStaff = staff.filter(s => s.is_active !== false);
  const findings = [];
  const CYCLE = 84; // 12 weeks

  for (const s of activeStaff) {
    const name = s.name || s.full_name || s.email || 'Unknown';
    const staffSupervisions = supervisions.filter(sv => sv.staff_id === s.id);
    const latest = staffSupervisions.sort((a, b) =>
      (b.supervision_date || '') > (a.supervision_date || '') ? 1 : -1
    )[0];

    if (!latest) {
      findings.push({
        category: 'supervision',
        severity: SEVERITY.CRITICAL,
        checkId: 'SUP_003',
        title: 'No supervision ever recorded',
        detail: `${name} has never had a recorded supervision`,
        staffId: s.id,
        staffName: name,
        regulation: 'CIW Reg 36 / CQC Reg 18',
      });
      continue;
    }

    const daysAgo = daysSince(latest.supervision_date);
    if (daysAgo > 112) { // >16 weeks = significantly overdue
      findings.push({
        category: 'supervision',
        severity: SEVERITY.CRITICAL,
        checkId: 'SUP_002',
        title: 'Supervision significantly overdue',
        detail: `${name} — last supervision ${daysAgo} days ago (${latest.supervision_date}). Over 16 weeks.`,
        staffId: s.id,
        staffName: name,
        regulation: 'CIW Reg 36 / CQC Reg 18',
      });
    } else if (daysAgo > CYCLE) { // >12 weeks
      findings.push({
        category: 'supervision',
        severity: SEVERITY.HIGH,
        checkId: 'SUP_001',
        title: 'Supervision overdue',
        detail: `${name} — last supervision ${daysAgo} days ago (${latest.supervision_date}). Due every 12 weeks.`,
        staffId: s.id,
        staffName: name,
        regulation: 'CIW Reg 36 / CQC Reg 18',
      });
    } else if (daysAgo > 70) { // Due within 14 days
      findings.push({
        category: 'supervision',
        severity: SEVERITY.WARNING,
        checkId: 'SUP_004',
        title: 'Supervision due soon',
        detail: `${name} — supervision due in ${CYCLE - daysAgo} days`,
        staffId: s.id,
        staffName: name,
        regulation: 'CIW Reg 36 / CQC Reg 18',
      });
    }
  }

  return findings;
}

function trainingChecks(data, framework) {
  const { staff, trainingCertificates, trainingMatrixRecords } = data;
  const activeStaff = staff.filter(s => s.is_active !== false);
  const findings = [];

  // Check for expired training certificates
  for (const cert of trainingCertificates) {
    if (!cert.expiry_date) continue;
    const daysUntilExpiry = differenceInCalendarDays(new Date(cert.expiry_date), today());
    const staffMember = activeStaff.find(s => s.id === cert.staff_id || s.id === cert.user_id);
    if (!staffMember) continue;
    const name = staffMember.name || staffMember.full_name || 'Unknown';

    if (daysUntilExpiry < 0) {
      findings.push({
        category: 'training',
        severity: SEVERITY.HIGH,
        checkId: 'TRAIN_002',
        title: 'Expired training certificate',
        detail: `${name} — "${cert.course_name || cert.title}" expired ${Math.abs(daysUntilExpiry)} days ago (${cert.expiry_date})`,
        staffId: staffMember.id,
        staffName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 35' : 'CQC Reg 18',
      });
    } else if (daysUntilExpiry <= 30) {
      findings.push({
        category: 'training',
        severity: SEVERITY.WARNING,
        checkId: 'TRAIN_003',
        title: 'Training certificate expiring soon',
        detail: `${name} — "${cert.course_name || cert.title}" expires in ${daysUntilExpiry} days`,
        staffId: staffMember.id,
        staffName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 35' : 'CQC Reg 18',
      });
    }
  }

  // Check for staff with no training records at all
  for (const s of activeStaff) {
    const name = s.name || s.full_name || s.email || 'Unknown';
    const hasCerts = trainingCertificates.some(c => c.staff_id === s.id || c.user_id === s.id);
    const hasMatrix = trainingMatrixRecords.some(m => m.staff_id === s.id || m.user_id === s.id);

    if (!hasCerts && !hasMatrix) {
      findings.push({
        category: 'training',
        severity: SEVERITY.HIGH,
        checkId: 'TRAIN_001',
        title: 'No training records',
        detail: `${name} has no training certificates or records on file`,
        staffId: s.id,
        staffName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 35' : 'CQC Reg 18',
      });
    }

    // Check induction for new starters (within 12 weeks of start)
    if (s.start_date) {
      const daysSinceStart = daysSince(s.start_date);
      if (daysSinceStart > 84 && daysSinceStart < 365) { // Started >12 weeks ago but <1 year
        const hasInduction = trainingCertificates.some(c =>
          (c.staff_id === s.id || c.user_id === s.id) &&
          (c.course_name?.toLowerCase().includes('induction') || c.title?.toLowerCase().includes('induction'))
        );
        if (!hasInduction) {
          findings.push({
            category: 'training',
            severity: SEVERITY.HIGH,
            checkId: 'TRAIN_004',
            title: 'Induction not completed',
            detail: `${name} — started ${daysSinceStart} days ago with no induction record (required within 12 weeks)`,
            staffId: s.id,
            staffName: name,
            regulation: framework === 'ciw' ? 'CIW Reg 34' : 'CQC Reg 18',
          });
        }
      }
    }
  }

  return findings;
}

function serviceUserChecks(data, framework) {
  const { serviceUsers, assessments } = data;
  const activeUsers = serviceUsers.filter(su =>
    su.status === 'active' || su.status === 'Active' || !su.status
  );
  const findings = [];

  for (const su of activeUsers) {
    const name = su.full_name || su.first_name + ' ' + su.last_name || 'Unknown';

    // Care plan review overdue
    if (su.plan_review_date) {
      const daysOverdue = daysSince(su.plan_review_date);
      if (daysOverdue > 0) {
        findings.push({
          category: 'service_users',
          severity: daysOverdue > 90 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
          checkId: 'SU_002',
          title: 'Care plan review overdue',
          detail: `${name} — review was due ${su.plan_review_date} (${daysOverdue} days overdue)`,
          serviceUserId: su.id,
          serviceUserName: name,
          regulation: framework === 'ciw' ? 'CIW Reg 22' : 'CQC Reg 9',
        });
      } else if (daysOverdue > -30) { // Due within 30 days
        findings.push({
          category: 'service_users',
          severity: SEVERITY.WARNING,
          checkId: 'SU_002_SOON',
          title: 'Care plan review due soon',
          detail: `${name} — review due in ${Math.abs(daysOverdue)} days (${su.plan_review_date})`,
          serviceUserId: su.id,
          serviceUserName: name,
          regulation: framework === 'ciw' ? 'CIW Reg 22' : 'CQC Reg 9',
        });
      }
    } else {
      // No review date set at all
      findings.push({
        category: 'service_users',
        severity: SEVERITY.HIGH,
        checkId: 'SU_002_NONE',
        title: 'No care plan review date set',
        detail: `${name} has no care plan review date recorded`,
        serviceUserId: su.id,
        serviceUserName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 22' : 'CQC Reg 9',
      });
    }

    // Missing emergency contact / next of kin
    if (!su.emergency_contact && !su.next_of_kin && !su.emergency_contact_name) {
      findings.push({
        category: 'service_users',
        severity: SEVERITY.HIGH,
        checkId: 'SU_004',
        title: 'Missing emergency contact',
        detail: `${name} has no emergency contact or next of kin on record`,
        serviceUserId: su.id,
        serviceUserName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 57' : 'CQC Reg 17',
      });
    }

    // No GP details
    if (!su.gp_name && !su.gp_surgery && !su.doctor_name) {
      findings.push({
        category: 'service_users',
        severity: SEVERITY.MEDIUM,
        checkId: 'SU_006',
        title: 'No GP details recorded',
        detail: `${name} has no GP or doctor information on record`,
        serviceUserId: su.id,
        serviceUserName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 27' : 'CQC Reg 12',
      });
    }

    // Check for assessments
    const userAssessments = assessments.filter(a =>
      a.service_user_id === su.id || a.client_id === su.id
    );
    if (userAssessments.length === 0) {
      findings.push({
        category: 'service_users',
        severity: SEVERITY.HIGH,
        checkId: 'SU_008',
        title: 'No assessment on file',
        detail: `${name} has no assessment records`,
        serviceUserId: su.id,
        serviceUserName: name,
        regulation: framework === 'ciw' ? 'CIW Reg 21' : 'CQC Reg 9',
      });
    }
  }

  return findings;
}

function medicationChecks(data, framework) {
  const { medicationRecords, medicationAdministrations, serviceUsers } = data;
  const findings = [];

  // Check for active medications with no recent administrations
  const activeMeds = medicationRecords.filter(m =>
    m.status === 'active' || m.is_active === true || !m.status
  );

  for (const med of activeMeds) {
    const su = serviceUsers.find(s => s.id === med.service_user_id || s.id === med.client_id);
    const suName = su?.full_name || 'Unknown service user';
    const medName = med.medication_name || med.name || 'Unknown medication';

    // Find administrations for this medication in last 7 days
    const recentAdmins = medicationAdministrations.filter(a =>
      (a.medication_record_id === med.id || a.medication_id === med.id) &&
      daysSince(a.administered_at || a.created_at) <= 7
    );

    // If medication is active but has zero administrations in 7 days
    if (recentAdmins.length === 0 && med.frequency !== 'prn' && med.frequency !== 'as_needed') {
      findings.push({
        category: 'medication',
        severity: SEVERITY.CRITICAL,
        checkId: 'MED_001',
        title: 'No recent MAR entries',
        detail: `${suName} — "${medName}" has no administration records in the last 7 days`,
        serviceUserId: su?.id,
        serviceUserName: suName,
        regulation: framework === 'ciw' ? 'CIW Reg 26' : 'CQC Reg 12',
      });
    }
  }

  // Check for refused/destroyed without reason
  const unreasonedRefusals = medicationAdministrations.filter(a =>
    (a.outcome === 'refused' || a.outcome === 'R' || a.outcome === 'destroyed' || a.outcome === 'D') &&
    !a.reason && !a.notes && !a.refusal_reason
  );

  for (const refusal of unreasonedRefusals.slice(0, 10)) { // Limit to 10
    const su = serviceUsers.find(s => s.id === refusal.service_user_id || s.id === refusal.client_id);
    findings.push({
      category: 'medication',
      severity: SEVERITY.HIGH,
      checkId: 'MED_004',
      title: 'Refused/destroyed medication without reason',
      detail: `${su?.full_name || 'Unknown'} — medication ${refusal.outcome} on ${refusal.administered_at || refusal.created_at} with no reason recorded`,
      serviceUserId: su?.id,
      regulation: framework === 'ciw' ? 'CIW Reg 26' : 'CQC Reg 12',
    });
  }

  return findings;
}

function careDeliveryChecks(data, framework) {
  const { shifts, careLogs } = data;
  const findings = [];

  // Look at shifts from last 30 days
  const recentShifts = shifts.filter(s => {
    const d = daysSince(s.date || s.shift_date);
    return d >= 0 && d <= 30;
  });

  // Unfilled shifts in the past
  const unfilledPast = recentShifts.filter(s =>
    !s.staff_id && (daysSince(s.date || s.shift_date) > 0)
  );
  if (unfilledPast.length > 0) {
    findings.push({
      category: 'care_delivery',
      severity: unfilledPast.length > 10 ? SEVERITY.CRITICAL : SEVERITY.HIGH,
      checkId: 'CARE_004',
      title: 'Unfilled shifts in past 30 days',
      detail: `${unfilledPast.length} shift(s) in the last 30 days had no staff assigned`,
      count: unfilledPast.length,
      regulation: framework === 'ciw' ? 'CIW Reg 28' : 'CQC Reg 18',
    });
  }

  // Shifts with staff assigned but no care log
  const assignedPastShifts = recentShifts.filter(s =>
    s.staff_id && (daysSince(s.date || s.shift_date) > 1)
  );

  // Get care log dates for comparison
  const careLogDates = new Set(
    careLogs.map(cl => `${cl.staff_id || cl.user_id}_${cl.visit_date || cl.date}`)
  );

  let missingLogs = 0;
  for (const s of assignedPastShifts) {
    const key = `${s.staff_id}_${s.date || s.shift_date}`;
    if (!careLogDates.has(key)) {
      missingLogs++;
    }
  }

  if (missingLogs > 0) {
    findings.push({
      category: 'care_delivery',
      severity: missingLogs > 20 ? SEVERITY.HIGH : SEVERITY.MEDIUM,
      checkId: 'CARE_001',
      title: 'Shifts without care logs',
      detail: `${missingLogs} assigned shift(s) in the last 30 days have no corresponding care log entry`,
      count: missingLogs,
      regulation: framework === 'ciw' ? 'CIW Reg 57' : 'CQC Reg 17',
    });
  }

  return findings;
}

function incidentChecks(data, framework) {
  const { incidents, safeguardingReports } = data;
  const findings = [];

  // No incidents in 90 days could indicate under-reporting
  const recentIncidents = incidents.filter(i => daysSince(i.incident_date || i.created_at) <= 90);
  if (recentIncidents.length === 0 && incidents.length > 0) {
    findings.push({
      category: 'incidents',
      severity: SEVERITY.WARNING,
      checkId: 'INC_004',
      title: 'No incidents reported in 90 days',
      detail: 'No incident reports filed in the last 90 days — this could indicate under-reporting',
      regulation: framework === 'ciw' ? 'CIW Reg 77' : 'CQC Reg 17',
    });
  }

  // Open incidents older than 30 days
  const openOldIncidents = incidents.filter(i =>
    (!i.resolved_date && !i.status?.includes('closed') && !i.status?.includes('resolved')) &&
    daysSince(i.incident_date || i.created_at) > 30
  );

  for (const inc of openOldIncidents.slice(0, 10)) {
    findings.push({
      category: 'incidents',
      severity: SEVERITY.MEDIUM,
      checkId: 'INC_006',
      title: 'Unresolved incident (>30 days)',
      detail: `Incident from ${inc.incident_date || inc.created_at} — "${inc.title || inc.description?.slice(0, 60) || 'No title'}" still open after 30+ days`,
      incidentId: inc.id,
      regulation: framework === 'ciw' ? 'CIW Reg 57' : 'CQC Reg 17',
    });
  }

  // Incidents without follow-up actions
  const noFollowUp = incidents.filter(i =>
    !i.action_taken && !i.follow_up && !i.actions_taken &&
    daysSince(i.incident_date || i.created_at) > 7
  );

  if (noFollowUp.length > 0) {
    findings.push({
      category: 'incidents',
      severity: SEVERITY.HIGH,
      checkId: 'INC_003',
      title: 'Incidents without follow-up',
      detail: `${noFollowUp.length} incident(s) have no investigation notes or follow-up actions recorded`,
      count: noFollowUp.length,
      regulation: framework === 'ciw' ? 'CIW Reg 57' : 'CQC Reg 17',
    });
  }

  return findings;
}

function governanceChecks(data, framework) {
  const { complianceReports, formSubmissions } = data;
  const findings = [];

  if (framework === 'ciw') {
    // RI visit overdue (>3 months)
    const riVisits = complianceReports.filter(r =>
      r.regulation_code === 'ciw_reg_73' && r.status === 'filed'
    );
    const lastRi = riVisits.sort((a, b) => (b.filed_date || '') > (a.filed_date || '') ? 1 : -1)[0];
    if (!lastRi) {
      findings.push({
        category: 'governance',
        severity: SEVERITY.HIGH,
        checkId: 'GOV_001',
        title: 'No RI visit on record',
        detail: 'No Responsible Individual visit (Reg 73) has been filed. Required quarterly.',
        regulation: 'CIW Reg 73',
      });
    } else if (daysSince(lastRi.filed_date) > 90) {
      findings.push({
        category: 'governance',
        severity: SEVERITY.HIGH,
        checkId: 'GOV_001',
        title: 'RI visit overdue',
        detail: `Last RI visit was ${lastRi.filed_date} (${daysSince(lastRi.filed_date)} days ago). Required every 3 months.`,
        regulation: 'CIW Reg 73',
      });
    }

    // Quality of Care Review overdue (>6 months)
    const qocReviews = complianceReports.filter(r =>
      r.regulation_code === 'ciw_reg_80' && r.status === 'filed'
    );
    const lastQoc = qocReviews.sort((a, b) => (b.filed_date || '') > (a.filed_date || '') ? 1 : -1)[0];
    if (!lastQoc) {
      findings.push({
        category: 'governance',
        severity: SEVERITY.HIGH,
        checkId: 'GOV_002',
        title: 'No Quality of Care Review on record',
        detail: 'No Quality of Care Review (Reg 80) has been filed. Required every 6 months.',
        regulation: 'CIW Reg 80',
      });
    } else if (daysSince(lastQoc.filed_date) > 180) {
      findings.push({
        category: 'governance',
        severity: SEVERITY.HIGH,
        checkId: 'GOV_002',
        title: 'Quality of Care Review overdue',
        detail: `Last review was ${lastQoc.filed_date} (${daysSince(lastQoc.filed_date)} days ago). Required every 6 months.`,
        regulation: 'CIW Reg 80',
      });
    }
  } else {
    // CQC: Governance audit overdue
    const govAudits = complianceReports.filter(r =>
      r.regulation_code === 'cqc_reg_17' && r.status === 'filed'
    );
    const lastGov = govAudits.sort((a, b) => (b.filed_date || '') > (a.filed_date || '') ? 1 : -1)[0];
    if (!lastGov) {
      findings.push({
        category: 'governance',
        severity: SEVERITY.HIGH,
        checkId: 'GOV_003',
        title: 'No governance audit on record',
        detail: 'No Good Governance review (Reg 17) has been filed. Required every 6 months.',
        regulation: 'CQC Reg 17',
      });
    } else if (daysSince(lastGov.filed_date) > 180) {
      findings.push({
        category: 'governance',
        severity: SEVERITY.HIGH,
        checkId: 'GOV_003',
        title: 'Governance audit overdue',
        detail: `Last governance review was ${lastGov.filed_date} (${daysSince(lastGov.filed_date)} days ago). Required every 6 months.`,
        regulation: 'CQC Reg 17',
      });
    }
  }

  return findings;
}

// ── Score calculation ────────────────────────────────────────────────────────

function calculateCategoryScore(findings, totalCheckable) {
  if (totalCheckable === 0) return 100;

  let deductions = 0;
  for (const f of findings) {
    switch (f.severity) {
      case SEVERITY.CRITICAL: deductions += 25; break;
      case SEVERITY.HIGH: deductions += 15; break;
      case SEVERITY.MEDIUM: deductions += 8; break;
      case SEVERITY.WARNING: deductions += 3; break;
    }
  }

  return Math.max(0, Math.min(100, 100 - deductions));
}

function getRating(score, hasCritical, framework) {
  if (hasCritical && score > 74) score = 74; // Critical findings cap at Adequate/RI
  if (framework === 'ciw') {
    if (score >= 90) return { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' };
    if (score >= 50) return { label: 'Adequate', color: 'text-orange-700', bg: 'bg-orange-100' };
    return { label: 'Poor', color: 'text-red-700', bg: 'bg-red-100' };
  } else {
    if (score >= 90) return { label: 'Outstanding', color: 'text-green-700', bg: 'bg-green-100' };
    if (score >= 75) return { label: 'Good', color: 'text-blue-700', bg: 'bg-blue-100' };
    if (score >= 50) return { label: 'Requires Improvement', color: 'text-orange-700', bg: 'bg-orange-100' };
    return { label: 'Inadequate', color: 'text-red-700', bg: 'bg-red-100' };
  }
}

// ── Main runner ──────────────────────────────────────────────────────────────

/**
 * Run the full virtual inspection.
 *
 * @param {object} data - All loaded entities
 * @param {string} framework - 'ciw' or 'cqc'
 * @returns {object} Full inspection report
 */
export function runVirtualInspection(data, framework = 'ciw') {
  const allFindings = [
    ...staffComplianceChecks(data, framework),
    ...supervisionChecks(data),
    ...trainingChecks(data, framework),
    ...serviceUserChecks(data, framework),
    ...medicationChecks(data, framework),
    ...careDeliveryChecks(data, framework),
    ...incidentChecks(data, framework),
    ...governanceChecks(data, framework),
  ];

  // Group by category
  const byCategory = {};
  for (const cat of Object.keys(INSPECTION_CATEGORIES)) {
    byCategory[cat] = allFindings.filter(f => f.category === cat);
  }

  // Calculate category scores
  const categoryScores = {};
  const totalCheckable = {
    staff_compliance: (data.staff?.filter(s => s.is_active !== false) || []).length || 1,
    supervision: (data.staff?.filter(s => s.is_active !== false) || []).length || 1,
    training: (data.staff?.filter(s => s.is_active !== false) || []).length || 1,
    service_users: (data.serviceUsers?.filter(su => su.status === 'active' || su.status === 'Active' || !su.status) || []).length || 1,
    medication: (data.medicationRecords || []).length || 1,
    care_delivery: 1,
    incidents: 1,
    governance: 1,
  };

  for (const [cat, catFindings] of Object.entries(byCategory)) {
    categoryScores[cat] = calculateCategoryScore(catFindings, totalCheckable[cat]);
  }

  // Overall weighted score
  let overallScore = 0;
  for (const [cat, catDef] of Object.entries(INSPECTION_CATEGORIES)) {
    overallScore += (categoryScores[cat] || 100) * catDef.weight;
  }
  overallScore = Math.round(overallScore);

  const hasCritical = allFindings.some(f => f.severity === SEVERITY.CRITICAL);
  const rating = getRating(overallScore, hasCritical, framework);

  // Counts by severity
  const severityCounts = {
    critical: allFindings.filter(f => f.severity === SEVERITY.CRITICAL).length,
    high: allFindings.filter(f => f.severity === SEVERITY.HIGH).length,
    medium: allFindings.filter(f => f.severity === SEVERITY.MEDIUM).length,
    warning: allFindings.filter(f => f.severity === SEVERITY.WARNING).length,
  };

  return {
    timestamp: new Date().toISOString(),
    framework,
    overallScore,
    rating,
    hasCritical,
    severityCounts,
    totalFindings: allFindings.length,
    categoryScores,
    byCategory,
    allFindings,
  };
}
