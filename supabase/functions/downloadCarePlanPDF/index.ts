import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@2.5.2';

// Bilingual labels for PDF generation
const labels = {
  en: {
    title: 'CARE PLAN',
    subtitle: 'Care Management System',
    client: 'Client',
    generated: 'Generated',
    personalInfo: 'PERSONAL INFORMATION',
    emergencyContact: 'EMERGENCY CONTACT',
    medicalInfo: 'MEDICAL INFORMATION',
    careDetails: 'CARE DETAILS',
    riskAssessments: 'RISK ASSESSMENTS',
    callTimes: 'SCHEDULED CALL TIMES',
    carePlan: 'COMPREHENSIVE CARE PLAN',
    whatMatters: 'WHAT MATTERS TO ME',
    quickRef: 'MY QUICK REFERENCE & PREFERENCES',
    briefHistory: 'BRIEF HISTORY OF ME',
    commNeeds: 'COMMUNICATION NEEDS',
    medHistory: 'MY MEDICAL HISTORY',
    planAims: 'OVERALL AIMS OF THE PERSONAL PLAN',
    equipment: 'ASSISTANCE EQUIPMENT IN THE PROPERTY',
    shutoffs: 'LOCATION OF EMERGENCY SHUT OFFS',
    pets: 'PETS IN PROPERTY',
    riskManagement: 'RISK MANAGEMENT',
    personCentredPlan: 'PERSON CENTRED PLAN BY CALL',
    planDoc: 'PLAN DOCUMENTATION',
    footer: 'Care Management System',
    page: 'Page',
    name: 'Name',
    dob: 'Date of Birth',
    address: 'Address',
    phone: 'Phone',
    status: 'Status',
    keySafe: 'Key Safe Code',
    relationship: 'Relationship',
    gp: 'GP',
    gpPhone: 'GP Phone',
    nhsNumber: 'NHS Number',
    allergies: 'Allergies',
    dietary: 'Dietary Requirements',
    mobility: 'Mobility Level',
    water: 'Water',
    electricity: 'Electricity',
    gas: 'Gas',
    notProvided: 'Not provided',
    noneKnown: 'None known',
    none: 'None',
    notSpecified: 'Not specified',
    noneSpecified: 'None specified',
    dateOfPlan: 'Date of Plan',
    completedBy: 'Completed/Signed By',
    reviewDate: 'Plan Review Date',
    section1: 'Section 1: Intended Outcome',
    section2: 'Section 2: Needs & Preferences',
    section3: 'Section 3: Care Staff Actions',
    risk: 'Risk',
    personSpecificRisks: 'Person Specific Risks',
    managingTheRisks: 'Managing The Risks',
  },
  cy: {
    title: 'CYNLLUN GOFAL',
    subtitle: 'System Rheoli Gofal',
    client: 'Cleient',
    generated: 'Cynhyrchwyd',
    personalInfo: 'GWYBODAETH BERSONOL',
    emergencyContact: 'CYSWLLT ARGYFWNG',
    medicalInfo: 'GWYBODAETH FEDDYGOL',
    careDetails: 'MANYLION GOFAL',
    riskAssessments: 'ASESIADAU RISG',
    callTimes: "AMSERAU GALWADAU WEDI'U TREFNU",
    carePlan: 'CYNLLUN GOFAL CYNHWYSFAWR',
    whatMatters: "BETH SY'N BWYSIG I MI",
    quickRef: 'FY NGHYFEIRNOD CYFLYM A DEWISIADAU',
    briefHistory: 'HANES BYR AMDANAF I',
    commNeeds: 'ANGHENION CYFATHREBU',
    medHistory: 'FY HANES MEDDYGOL',
    planAims: 'NODAU CYFFREDINOL Y CYNLLUN PERSONOL',
    equipment: "OFFER CYMORTH YN YR EIDDO",
    shutoffs: "LLEOLIAD DIFFODDWYR ARGYFWNG YN YR EIDDO",
    pets: "ANIFEILIAID ANWES YN YR EIDDO",
    riskManagement: 'RHEOLI RISG',
    personCentredPlan: "CYNLLUN SY'N CANOLBWYNTIO AR Y PERSON YN \u00d4L GALWAD",
    planDoc: "DOGFENNAETH Y CYNLLUN",
    footer: 'System Rheoli Gofal',
    page: 'Tudalen',
    name: 'Enw',
    dob: 'Dyddiad Geni',
    address: 'Cyfeiriad',
    phone: 'Ff\u00f4n',
    status: 'Statws',
    keySafe: 'Cod Allwedd Ddiogel',
    relationship: 'Perthynas',
    gp: 'Meddyg Teulu',
    gpPhone: 'Ff\u00f4n Meddyg Teulu',
    nhsNumber: 'Rhif GIG',
    allergies: 'Alergeddau',
    dietary: 'Gofynion Deietegol',
    mobility: 'Lefel Symudedd',
    water: 'D\u0175r',
    electricity: 'Trydan',
    gas: 'Nwy',
    notProvided: 'Heb ei ddarparu',
    noneKnown: 'Dim yn hysbys',
    none: 'Dim',
    notSpecified: 'Heb ei nodi',
    noneSpecified: 'Dim wedi ei nodi',
    dateOfPlan: "Dyddiad Y Cynllun",
    completedBy: "Cwblhawyd/Llofnodwyd Gan",
    reviewDate: "Dyddiad Adolygu'r Cynllun",
    section1: 'Adran 1: Canlyniad Bwriadedig',
    section2: 'Adran 2: Anghenion a Dewisiadau',
    section3: 'Adran 3: Gweithredoedd Staff Gofal',
    risk: 'Risg',
    personSpecificRisks: "Risgiau Penodol I'r Person",
    managingTheRisks: "Rheoli'r Risgiau",
  }
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
Deno.serve(async (req) => {
  try {
      if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { serviceUserId, language: reqLang } = await req.json();
    const lang = reqLang === 'cy' ? 'cy' : 'en';
    const t = labels[lang];

    if (!serviceUserId) {
      return Response.json({ error: 'Service user ID required' }, { status: 400 });
    }

    const serviceUser = await supabaseAdmin.entities.ServiceUser.get(serviceUserId);

    if (!serviceUser) {
      return Response.json({ error: 'Service user not found' }, { status: 404 });
    }

    const doc = new jsPDF();
    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPosition = margin;

    // Company header
    doc.setFillColor(16, 185, 129); // teal color
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text('Accredi-Care', margin, 15);
    doc.setFontSize(10);
    doc.text(t.subtitle, margin, 25);

    // Language badge in header
    if (lang === 'cy') {
      doc.setFontSize(9);
      doc.text('Cymraeg', pageWidth - margin - 20, 15);
    }

    doc.setTextColor(0, 0, 0);
    yPosition = 50;

    // Title
    doc.setFontSize(16);
    doc.setTextColor(16, 185, 129);
    doc.text(t.title, margin, yPosition);
    yPosition += 10;

    // Client name and date
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${t.client}: ${serviceUser.full_name}`, margin, yPosition);
    yPosition += 6;
    doc.text(`${t.generated}: ${new Date().toLocaleDateString(lang === 'cy' ? 'cy-GB' : 'en-GB')}`, margin, yPosition);
    yPosition += 10;

    // Helper function to add section
    const addSection = (title, content) => {
      if (!content || content.trim() === '') return;
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      doc.setFontSize(12);
      doc.setTextColor(16, 185, 129);
      doc.text(title, margin, yPosition);
      yPosition += 7;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);

      const lines = doc.splitTextToSize(content, pageWidth - 2 * margin);
      doc.text(lines, margin, yPosition);
      yPosition += lines.length * 5 + 8;
    };

    // Personal Information
    const personalInfo = `
${t.name}: ${serviceUser.full_name}
${t.dob}: ${serviceUser.date_of_birth || t.notProvided}
${t.address}: ${serviceUser.address}${serviceUser.postcode ? ', ' + serviceUser.postcode : ''}
${t.phone}: ${serviceUser.phone || t.notProvided}
${t.status}: ${serviceUser.status.replace('_', ' ')}
${t.keySafe}: ${serviceUser.key_safe_code || t.notProvided}`.trim();
    addSection(t.personalInfo, personalInfo);

    // Emergency Contact
    if (serviceUser.emergency_contact_name || serviceUser.emergency_contact_phone) {
      const emergencyInfo = `
${t.name}: ${serviceUser.emergency_contact_name || t.notProvided}
${t.phone}: ${serviceUser.emergency_contact_phone || t.notProvided}
${t.relationship}: ${serviceUser.emergency_contact_relationship || t.notProvided}`.trim();
      addSection(t.emergencyContact, emergencyInfo);
    }

    // Medical Information
    if (serviceUser.gp_name || serviceUser.nhs_number || serviceUser.allergies || serviceUser.dietary_requirements) {
      const medicalInfo = `
${t.gp}: ${serviceUser.gp_name || t.notProvided}
${t.gpPhone}: ${serviceUser.gp_phone || t.notProvided}
${t.nhsNumber}: ${serviceUser.nhs_number || t.notProvided}
${t.allergies}: ${serviceUser.allergies || t.noneKnown}
${t.dietary}: ${serviceUser.dietary_requirements || t.none}
${t.mobility}: ${serviceUser.mobility_level || t.notSpecified}`.trim();
      addSection(t.medicalInfo, medicalInfo);
    }

    // What Matters To Me
    addSection(t.whatMatters, serviceUser.what_matters_to_me);

    // Quick Reference
    addSection(t.quickRef, serviceUser.quick_reference);

    // Brief History
    addSection(t.briefHistory, serviceUser.brief_history);

    // Communication Needs
    addSection(t.commNeeds, serviceUser.communication_needs);

    // Medical History
    addSection(t.medHistory, serviceUser.medical_history);

    // Personal Plan Aims
    addSection(t.planAims, serviceUser.personal_plan_aims);

    // Assistance Equipment
    addSection(t.equipment, serviceUser.assistance_equipment);

    // Emergency Shutoffs
    if (serviceUser.emergency_shutoff_water || serviceUser.emergency_shutoff_electricity || serviceUser.emergency_shutoff_gas) {
      let shutoffText = '';
      if (serviceUser.emergency_shutoff_water) shutoffText += `${t.water}: ${serviceUser.emergency_shutoff_water}\n`;
      if (serviceUser.emergency_shutoff_electricity) shutoffText += `${t.electricity}: ${serviceUser.emergency_shutoff_electricity}\n`;
      if (serviceUser.emergency_shutoff_gas) shutoffText += `${t.gas}: ${serviceUser.emergency_shutoff_gas}\n`;
      addSection(t.shutoffs, shutoffText.trim());
    }

    // Pets
    addSection(t.pets, serviceUser.pets_in_property);

    // Risk Assessments - table format
    if (serviceUser.risk_assessment_rows) {
      try {
        const rows = JSON.parse(serviceUser.risk_assessment_rows);
        if (Array.isArray(rows) && rows.length > 0) {
          if (yPosition > pageHeight - 40) { doc.addPage(); yPosition = margin; }
          doc.setFontSize(12);
          doc.setTextColor(16, 185, 129);
          doc.text(t.riskManagement, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(9);
          doc.setTextColor(0, 0, 0);
          for (const row of rows) {
            if (yPosition > pageHeight - 30) { doc.addPage(); yPosition = margin; }
            const riskText = `${t.risk}: ${row.col1 || ''}\n${t.personSpecificRisks}: ${row.col2 || ''}\n${t.managingTheRisks}: ${row.col3 || ''}`;
            const lines = doc.splitTextToSize(riskText, pageWidth - 2 * margin);
            doc.text(lines, margin, yPosition);
            yPosition += lines.length * 4.5 + 6;
          }
          yPosition += 4;
        }
      } catch {
        addSection(t.riskManagement, serviceUser.risk_management);
      }
    } else if (serviceUser.risk_management) {
      addSection(t.riskManagement, serviceUser.risk_management);
    }

    // Additional Risk Notes
    addSection(t.riskAssessments, serviceUser.risk_assessments);

    // Person Centred Plan By Call
    if (serviceUser.person_centred_plan) {
      try {
        const calls = JSON.parse(serviceUser.person_centred_plan);
        if (Array.isArray(calls) && calls.length > 0) {
          if (yPosition > pageHeight - 40) { doc.addPage(); yPosition = margin; }
          doc.setFontSize(12);
          doc.setTextColor(16, 185, 129);
          doc.text(t.personCentredPlan, margin, yPosition);
          yPosition += 7;
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          for (const call of calls) {
            if (yPosition > pageHeight - 40) { doc.addPage(); yPosition = margin; }
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0);
            doc.text(call.call_number || '', margin, yPosition);
            yPosition += 6;
            doc.setFontSize(9);
            const s1 = `${t.section1}: ${call.section1 || ''}`;
            const s2 = `${t.section2}: ${call.section2 || ''}`;
            const s3 = `${t.section3}: ${call.section3 || ''}`;
            for (const section of [s1, s2, s3]) {
              if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = margin; }
              const lines = doc.splitTextToSize(section, pageWidth - 2 * margin - 5);
              doc.text(lines, margin + 5, yPosition);
              yPosition += lines.length * 4.5 + 3;
            }
            yPosition += 4;
          }
        }
      } catch {
        addSection(t.personCentredPlan, serviceUser.person_centred_plan);
      }
    }

    // Call Times
    if (serviceUser.call_times && serviceUser.call_times.length > 0) {
      const callsText = serviceUser.call_times
        .map(call => `${call.time} (${call.duration} mins) - ${call.type}${call.notes ? ': ' + call.notes : ''}`)
        .join('\n');
      addSection(t.callTimes, callsText);
    }

    // Plan Documentation
    if (serviceUser.care_plan_date || serviceUser.plan_completed_by || serviceUser.plan_review_date) {
      let planDocText = '';
      if (serviceUser.care_plan_date) planDocText += `${t.dateOfPlan}: ${serviceUser.care_plan_date}\n`;
      if (serviceUser.plan_completed_by) planDocText += `${t.completedBy}: ${serviceUser.plan_completed_by}\n`;
      if (serviceUser.plan_review_date) planDocText += `${t.reviewDate}: ${serviceUser.plan_review_date}\n`;
      addSection(t.planDoc, planDocText.trim());
    }

    // Legacy care plan field
    if (serviceUser.care_plan) {
      addSection(t.carePlan, serviceUser.care_plan);
    }

    // Footer on all pages
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(`Accredi-Care - ${t.footer} | ${t.page} ${i}/${totalPages}`, margin, pageHeight - 10);
    }

    // Generate PDF
    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="care-plan-${serviceUser.full_name.replace(/\s+/g, '-')}.pdf"`,
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
