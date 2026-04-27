/**
 * assessmentPDF.js
 * Client-side Assessment of Needs PDF generator using jsPDF.
 * Produces a professional assessment report showing each section reviewed,
 * whether changes were made or no changes needed, and all current data.
 * Used as CIW/CQC compliance evidence.
 */
import { jsPDF } from 'jspdf';

const TEAL = [13, 148, 136];
const SLATE_900 = [15, 23, 42];
const SLATE_600 = [71, 85, 105];
const SLATE_400 = [148, 163, 184];
const GREEN = [22, 163, 74];
const AMBER = [217, 119, 6];
const WHITE = [255, 255, 255];
const LIGHT_BG = [248, 250, 252];
const GREEN_BG = [240, 253, 244];
const AMBER_BG = [255, 251, 235];

const SECTION_LABELS = {
  personal: 'Personal Information',
  emergency: 'Emergency Contact',
  medical: 'Medical Information',
  care_plan: 'Care Plan',
  calls: 'Scheduled Calls',
  meds: 'Medications & eMAR',
};

function addPageFooter(doc, pageNum, totalPages, orgName) {
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  doc.setDrawColor(...SLATE_400);
  doc.setLineWidth(0.3);
  doc.line(15, ph - 18, pw - 15, ph - 18);
  doc.setFontSize(7);
  doc.setTextColor(...SLATE_400);
  doc.text('Assessment of Needs — CareCallAI', 15, ph - 12);
  if (orgName) doc.text(orgName, pw / 2, ph - 12, { align: 'center' });
  doc.text(`Page ${pageNum} of ${totalPages}`, pw - 15, ph - 12, { align: 'right' });
}

function checkPageBreak(doc, y, needed = 30) {
  const ph = doc.internal.pageSize.getHeight();
  if (y + needed > ph - 25) {
    doc.addPage();
    return 30;
  }
  return y;
}

function addField(doc, label, value, x, y, maxWidth) {
  y = checkPageBreak(doc, y, 14);
  doc.setFontSize(7);
  doc.setTextColor(...SLATE_400);
  doc.text(label, x, y);
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_900);
  const text = value || 'Not provided';
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, x, y + 4.5);
  return y + 4.5 + (lines.length * 3.8);
}

/**
 * Generate assessment PDF
 * @param {object} serviceUser - full service user record
 * @param {object} options - { type, completedBy, date, nextReassessment, sectionsReviewed }
 * @returns {Blob}
 */
export async function generateAssessmentPDF(serviceUser, options) {
  const { type, completedBy, date, nextReassessment, sectionsReviewed } = options;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw = doc.internal.pageSize.getWidth();
  const contentWidth = pw - 30;
  let y = 0;

  // ── COVER PAGE ──────────────────────────────────────────────────────────

  // Teal header bar
  doc.setFillColor(...TEAL);
  doc.rect(0, 0, pw, 50, 'F');

  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.setFont(undefined, 'bold');
  doc.text('ASSESSMENT OF NEEDS', pw / 2, 22, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(type === 'initial' ? 'Initial Assessment' : 'Re-Assessment', pw / 2, 32, { align: 'center' });

  doc.setFontSize(8);
  doc.text('CareCallAI Care Management System', pw / 2, 42, { align: 'center' });

  // Client info box
  y = 65;
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(15, y - 5, contentWidth, 30, 3, 3, 'F');

  doc.setFontSize(14);
  doc.setTextColor(...SLATE_900);
  doc.setFont(undefined, 'bold');
  doc.text(serviceUser.full_name || 'Unknown Client', 25, y + 5);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...SLATE_600);
  doc.text(`Date of Assessment: ${formatDateStr(date)}`, 25, y + 13);
  doc.text(`Completed By: ${completedBy}`, 25, y + 19);
  doc.text(`Next Re-Assessment Due: ${formatDateStr(nextReassessment)}`, pw / 2, y + 13);
  doc.text(`Type: ${type === 'initial' ? 'Initial Assessment' : 'Re-Assessment'}`, pw / 2, y + 19);

  // ── SECTIONS OVERVIEW ───────────────────────────────────────────────────
  y = 110;
  doc.setFontSize(12);
  doc.setTextColor(...TEAL);
  doc.setFont(undefined, 'bold');
  doc.text('ASSESSMENT SUMMARY', 15, y);
  y += 3;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.5);
  doc.line(15, y, pw - 15, y);
  y += 8;

  doc.setFontSize(9);
  doc.setTextColor(...SLATE_600);
  doc.setFont(undefined, 'normal');
  doc.text('Each section of the client record was reviewed during this assessment. The outcome is shown below:', 15, y);
  y += 10;

  // Section status table
  Object.entries(SECTION_LABELS).forEach(([key, label]) => {
    const status = sectionsReviewed?.[key];
    const statusText = status === 'updated' ? 'CHANGES MADE' : status === 'no_changes' ? 'NO CHANGES NEEDED' : 'NOT REVIEWED';
    const bgColor = status === 'updated' ? AMBER_BG : status === 'no_changes' ? GREEN_BG : LIGHT_BG;
    const textColor = status === 'updated' ? AMBER : status === 'no_changes' ? GREEN : SLATE_400;

    doc.setFillColor(...bgColor);
    doc.roundedRect(15, y - 3.5, contentWidth, 10, 1.5, 1.5, 'F');

    doc.setFontSize(9);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(...SLATE_900);
    doc.text(label, 20, y + 2);

    doc.setTextColor(...textColor);
    doc.text(statusText, pw - 20, y + 2, { align: 'right' });

    y += 13;
  });

  // ── DETAILED SECTIONS ──────────────────────────────────────────────────
  doc.addPage();
  y = 20;

  // Personal
  y = addSectionHeader(doc, 'PERSONAL INFORMATION', sectionsReviewed?.personal, y);
  y = addField(doc, 'Full Name', serviceUser.full_name, 15, y, contentWidth);
  y = addField(doc, 'Date of Birth', serviceUser.date_of_birth, 15, y + 2, contentWidth);
  y = addField(doc, 'Address', [serviceUser.address, serviceUser.postcode].filter(Boolean).join(', '), 15, y + 2, contentWidth);
  y = addField(doc, 'Phone', serviceUser.phone, 15, y + 2, contentWidth / 2);
  y = addField(doc, 'Key Safe Code', serviceUser.key_safe_code, 15, y + 2, contentWidth / 2);
  y += 8;

  // Emergency
  y = checkPageBreak(doc, y, 40);
  y = addSectionHeader(doc, 'EMERGENCY CONTACT', sectionsReviewed?.emergency, y);
  y = addField(doc, 'Contact Name', serviceUser.emergency_contact_name, 15, y, contentWidth);
  y = addField(doc, 'Contact Phone', serviceUser.emergency_contact_phone, 15, y + 2, contentWidth);
  y = addField(doc, 'Relationship', serviceUser.emergency_contact_relationship, 15, y + 2, contentWidth);
  y += 8;

  // Medical
  y = checkPageBreak(doc, y, 50);
  y = addSectionHeader(doc, 'MEDICAL INFORMATION', sectionsReviewed?.medical, y);
  y = addField(doc, 'GP Name', serviceUser.gp_name, 15, y, contentWidth);
  y = addField(doc, 'GP Phone', serviceUser.gp_phone, 15, y + 2, contentWidth);
  y = addField(doc, 'NHS Number', serviceUser.nhs_number, 15, y + 2, contentWidth);
  y = addField(doc, 'Allergies', serviceUser.allergies, 15, y + 2, contentWidth);
  y = addField(doc, 'Dietary Requirements', serviceUser.dietary_requirements, 15, y + 2, contentWidth);
  y = addField(doc, 'Mobility Level', serviceUser.mobility_level ? serviceUser.mobility_level.replace('_', ' ') : null, 15, y + 2, contentWidth);
  y += 8;

  // Care Plan
  y = checkPageBreak(doc, y, 30);
  y = addSectionHeader(doc, 'CARE PLAN', sectionsReviewed?.care_plan, y);
  y = addField(doc, 'Quick Reference & Preferences', serviceUser.quick_reference, 15, y, contentWidth);
  y = addField(doc, 'What Matters To Me', serviceUser.what_matters_to_me, 15, y + 2, contentWidth);
  y = addField(doc, 'Brief History', serviceUser.brief_history, 15, y + 2, contentWidth);
  y = addField(doc, 'Communication Needs', serviceUser.communication_needs, 15, y + 2, contentWidth);
  y = addField(doc, 'Medical History', serviceUser.medical_history, 15, y + 2, contentWidth);
  y = addField(doc, 'Overall Aims', serviceUser.personal_plan_aims, 15, y + 2, contentWidth);
  y = addField(doc, 'DNA CPR In Place', serviceUser.dna_cpr_in_place, 15, y + 2, contentWidth);
  y = addField(doc, 'Assistance Equipment', serviceUser.assistance_equipment, 15, y + 2, contentWidth);
  y = addField(doc, 'Water Shutoff', serviceUser.emergency_shutoff_water, 15, y + 2, contentWidth);
  y = addField(doc, 'Electricity Shutoff', serviceUser.emergency_shutoff_electricity, 15, y + 2, contentWidth);
  y = addField(doc, 'Gas Shutoff', serviceUser.emergency_shutoff_gas, 15, y + 2, contentWidth);
  y = addField(doc, 'Pets In Property', serviceUser.pets_in_property, 15, y + 2, contentWidth);
  y = addField(doc, 'Risk Management', serviceUser.risk_management, 15, y + 2, contentWidth);
  y = addField(doc, 'Notes', serviceUser.notes, 15, y + 2, contentWidth);
  y += 8;

  // Calls
  y = checkPageBreak(doc, y, 30);
  y = addSectionHeader(doc, 'SCHEDULED CALLS', sectionsReviewed?.calls, y);
  if (serviceUser.call_times?.length > 0) {
    serviceUser.call_times.forEach((call) => {
      y = checkPageBreak(doc, y, 12);
      doc.setFontSize(9);
      doc.setTextColor(...SLATE_900);
      const callText = `${call.time || '?'} — ${call.duration || '?'} mins${call.type ? ` (${call.type})` : ''}${call.notes ? ` — ${call.notes}` : ''}`;
      doc.text(`• ${callText}`, 20, y);
      y += 5;
    });
  } else {
    doc.setFontSize(9);
    doc.setTextColor(...SLATE_400);
    doc.text('No scheduled calls', 20, y);
    y += 5;
  }
  y += 8;

  // Meds
  y = checkPageBreak(doc, y, 20);
  y = addSectionHeader(doc, 'MEDICATIONS & eMAR', sectionsReviewed?.meds, y);
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_600);
  doc.text('Medication records are maintained in the electronic MAR chart within the CareCallAI system.', 15, y);
  y += 5;
  doc.text('Please refer to the Meds & eMAR section for the full current medication list.', 15, y);
  y += 12;

  // ── SIGNATURE SECTION ──────────────────────────────────────────────────
  y = checkPageBreak(doc, y, 40);
  doc.setFillColor(...LIGHT_BG);
  doc.roundedRect(15, y - 3, contentWidth, 35, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...TEAL);
  doc.text('ASSESSMENT SIGN-OFF', 20, y + 4);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(...SLATE_900);
  doc.text(`Assessor: ${completedBy}`, 20, y + 12);
  doc.text(`Date: ${formatDateStr(date)}`, pw / 2, y + 12);
  doc.text(`Assessment Type: ${type === 'initial' ? 'Initial Assessment' : 'Re-Assessment'}`, 20, y + 19);
  doc.text(`Next Re-Assessment Due: ${formatDateStr(nextReassessment)}`, pw / 2, y + 19);
  doc.text('This assessment has been completed in accordance with CIW/CQC regulatory requirements.', 20, y + 27);

  // ── ADD PAGE NUMBERS ───────────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageFooter(doc, i, totalPages, '');
  }

  return doc.output('blob');
}

function addSectionHeader(doc, title, status, y) {
  const pw = doc.internal.pageSize.getWidth();
  y = checkPageBreak(doc, y, 20);

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...TEAL);
  doc.text(title, 15, y);

  // Status badge
  const statusText = status === 'updated' ? 'CHANGES MADE' : status === 'no_changes' ? 'NO CHANGES NEEDED' : 'REVIEWED';
  const badgeColor = status === 'updated' ? AMBER : status === 'no_changes' ? GREEN : SLATE_400;
  doc.setFontSize(7);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(...badgeColor);
  doc.text(statusText, pw - 15, y, { align: 'right' });

  y += 2;
  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.3);
  doc.line(15, y, pw - 15, y);

  doc.setFont(undefined, 'normal');
  return y + 6;
}

function formatDateStr(d) {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch { return d; }
}
