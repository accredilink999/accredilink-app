import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@2.5.2';

function getBodyRegion(x: number, y: number): string {
  if (y < 0.15) return 'Head';
  if (y < 0.25) return x < 0.35 ? 'Right Shoulder' : x > 0.65 ? 'Left Shoulder' : 'Neck/Upper Chest';
  if (y < 0.35) return x < 0.25 ? 'Right Arm' : x > 0.75 ? 'Left Arm' : 'Upper Torso';
  if (y < 0.50) return x < 0.25 ? 'Right Arm' : x > 0.75 ? 'Left Arm' : 'Lower Torso';
  if (y < 0.55) return 'Hip Area';
  if (y < 0.75) return x < 0.40 ? 'Right Thigh' : x > 0.60 ? 'Left Thigh' : 'Upper Legs';
  if (y < 0.90) return x < 0.40 ? 'Right Lower Leg' : x > 0.60 ? 'Left Lower Leg' : 'Lower Legs';
  return x < 0.40 ? 'Right Foot' : x > 0.60 ? 'Left Foot' : 'Feet';
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } });
    }

    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    // Check role via user profile (not user.role which doesn't exist on auth user)
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('role, full_name, organization_id')
      .eq('id', currentUser.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { serviceUserId, serviceUserName, logType, startDate, endDate } = body;

    if (!serviceUserId || !logType || !startDate || !endDate) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Fetch service user details for the cover sheet
    const { data: serviceUser } = await supabaseAdmin
      .from('service_users')
      .select('full_name, date_of_birth, address, phone, care_type, status')
      .eq('id', serviceUserId)
      .single();

    // Fetch organisation details for the cover sheet
    const { data: org } = await supabaseAdmin
      .from('organizations')
      .select('name, phone, email, address')
      .eq('id', profile.organization_id)
      .single();

    let logs: any[] = [];
    if (logType === 'care') {
      // Filter at DB level by service_user_id and date range
      const { data, error } = await supabaseAdmin
        .from('care_logs')
        .select('*')
        .eq('service_user_id', serviceUserId)
        .gte('visit_date', startDate)
        .lte('visit_date', endDate)
        .order('visit_date', { ascending: true })
        .order('visit_time', { ascending: true });
      if (error) throw error;
      logs = data || [];
    } else if (logType === 'healthcare') {
      const { data, error } = await supabaseAdmin
        .from('healthcare_logs')
        .select('*')
        .eq('service_user_id', serviceUserId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });
      if (error) throw error;
      logs = data || [];
    }

    // Fetch form configs for custom field labels
    let formConfigs: any[] = [];
    try {
      const { data: cfgData } = await supabaseAdmin.from('care_log_form_configs').select('*');
      formConfigs = cfgData || [];
    } catch (_e) {
      // Table may not exist yet — continue without labels
    }

    const doc = new jsPDF();
    doc.setFont('helvetica');
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    // ─── COVER SHEET ────────────────────────────────────────────────────────

    // Top colour bar
    doc.setFillColor(30, 58, 138); // dark blue
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(logType === 'care' ? 'Care Log Report' : 'Communication Log Report', margin, 22);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(org?.name || 'Care Provider', margin, 33);

    doc.setTextColor(0, 0, 0);

    // Client info box
    doc.setFillColor(241, 245, 249); // slate-100
    doc.roundedRect(margin, 50, pageWidth - margin * 2, 55, 3, 3, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Details', margin + 6, 62);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const clientName = serviceUser?.full_name || serviceUserName || 'Unknown';
    doc.text(`Name:`, margin + 6, 73);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName, margin + 30, 73);
    doc.setFont('helvetica', 'normal');

    if (serviceUser?.date_of_birth) {
      doc.text(`Date of Birth:`, margin + 6, 81);
      doc.text(serviceUser.date_of_birth, margin + 45, 81);
    }
    if (serviceUser?.address) {
      const addr = doc.splitTextToSize(`Address: ${serviceUser.address}`, pageWidth - margin * 2 - 12);
      doc.text(addr, margin + 6, 89);
    }
    if (serviceUser?.care_type) {
      doc.text(`Care Type:`, margin + 6, 97);
      doc.text(serviceUser.care_type.replace(/_/g, ' '), margin + 35, 97);
    }

    // Report period box
    doc.setFillColor(219, 234, 254); // blue-100
    doc.roundedRect(margin, 115, pageWidth - margin * 2, 35, 3, 3, 'F');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Period', margin + 6, 127);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`From: ${startDate}`, margin + 6, 137);
    doc.text(`To: ${endDate}`, margin + 70, 137);
    doc.text(`Total Entries: ${logs.length}`, margin + 130, 137);
    doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, margin + 6, 144);
    doc.text(`Generated by: ${profile.full_name || 'Administrator'}`, margin + 90, 144);

    // Provider info box
    if (org) {
      doc.setFillColor(240, 253, 244); // green-50
      doc.roundedRect(margin, 160, pageWidth - margin * 2, 45, 3, 3, 'F');

      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Care Provider', margin + 6, 172);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (org.name) doc.text(org.name, margin + 6, 181);
      if (org.phone) doc.text(`Tel: ${org.phone}`, margin + 6, 188);
      if (org.email) doc.text(`Email: ${org.email}`, margin + 6, 195);
      if (org.address) {
        const addr2 = doc.splitTextToSize(`Address: ${org.address}`, pageWidth - margin * 2 - 12);
        doc.text(addr2, margin + 6, 202);
      }
    }

    // Footer on cover page
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('CONFIDENTIAL — This document contains personal care information. Handle in accordance with GDPR and organisational policy.', margin, pageHeight - 15, { maxWidth: pageWidth - margin * 2 });
    doc.setTextColor(0, 0, 0);

    // ─── LOG ENTRIES ─────────────────────────────────────────────────────────

    if (logs.length === 0) {
      doc.addPage();
      doc.setFontSize(14);
      doc.setTextColor(100, 116, 139);
      doc.text('No care log entries found for the selected date range.', pageWidth / 2, pageHeight / 2, { align: 'center' });
    }

    logs.forEach((log, index) => {
      doc.addPage();
      let yPosition = margin;

      // Entry header bar
      doc.setFillColor(30, 58, 138);
      doc.rect(0, 0, pageWidth, 16, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(`Entry ${index + 1} of ${logs.length}  •  ${log.visit_date || log.date}${log.visit_time ? ' at ' + log.visit_time : ''}  •  ${clientName}`, margin, 11);
      doc.setTextColor(0, 0, 0);

      yPosition = 28;

      const addLine = (label: string, value: string | null | undefined, indent = false) => {
        if (!value) return;
        if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = margin; }
        const x = indent ? margin + 8 : margin;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const labelWidth = doc.getTextWidth(label + '  ');
        doc.text(label, x, yPosition);
        doc.setFont('helvetica', 'normal');
        const wrapped = doc.splitTextToSize(value, pageWidth - x - margin - labelWidth);
        doc.text(wrapped[0], x + labelWidth, yPosition);
        for (let i = 1; i < wrapped.length; i++) {
          yPosition += 5;
          if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = margin; }
          doc.text(wrapped[i], x + labelWidth, yPosition);
        }
        yPosition += 6;
      };

      const addSection = (title: string) => {
        if (yPosition > pageHeight - 30) { doc.addPage(); yPosition = margin; }
        yPosition += 2;
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, yPosition - 4, pageWidth - margin * 2, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(title, margin + 3, yPosition + 1);
        doc.setFont('helvetica', 'normal');
        yPosition += 8;
      };

      if (logType === 'care') {
        addSection('Visit Summary');
        addLine('Staff:', log.staff_name);
        addLine('Status:', log.status ? log.status.charAt(0).toUpperCase() + log.status.slice(1) : undefined);
        addLine('Duration:', log.duration_minutes ? `${log.duration_minutes} minutes` : undefined);
        addLine('Double Handed:', log.double_handed_call);
        addLine('Staff Grade:', log.staff_grade);

        addSection('Welfare & Observations');
        addLine('Welfare on Arrival:', log.welfare_impression_on_arrival?.replace(/_/g, ' '));
        addLine('Mood:', log.mood ? log.mood.charAt(0).toUpperCase() + log.mood.slice(1) : undefined);
        if (log.observations) {
          if (yPosition > pageHeight - 30) { doc.addPage(); yPosition = margin; }
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text('Observations:', margin, yPosition);
          yPosition += 6;
          doc.setFont('helvetica', 'normal');
          const wrapped = doc.splitTextToSize(log.observations, pageWidth - margin * 2 - 8);
          wrapped.forEach(line => {
            if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = margin; }
            doc.text(line, margin + 8, yPosition);
            yPosition += 5;
          });
        }

        addSection('Personal Care');
        addLine('Personal Care:', log.personal_care);
        addLine('Details:', log.personal_care_description, true);
        addLine('Continence Care:', log.continence_care_provided);
        addLine('Catheter Care:', log.catheter_care_provided);
        addLine('Catheter Details:', log.catheter_care_description, true);
        addLine('Repositioned:', log.repositioned_on_visit);
        addLine('Skincare:', log.skincare_provided);
        addLine('Skin Integrity Concerns:', log.skin_integrity_concerns);

        addSection('Nutrition & Fluids');
        addLine('Food Intake:', log.food_intake ? log.food_intake.charAt(0).toUpperCase() + log.food_intake.slice(1) : undefined);
        addLine('Food Offered:', log.food_offered);
        addLine('Food Accepted:', log.food_accepted, true);
        addLine('What Was Given:', log.food_given, true);
        addLine('Food Outcome:', log.food_outcome?.replace(/_/g, ' '), true);
        addLine('Fluid Intake:', log.fluid_intake ? log.fluid_intake.charAt(0).toUpperCase() + log.fluid_intake.slice(1) : undefined);
        addLine('Drinks Offered:', log.drinks_offered);
        addLine('Drinks Accepted:', log.drinks_accepted, true);
        addLine('What Was Given:', log.drinks_given, true);
        addLine('Drinks Outcome:', log.drinks_outcome?.replace(/_/g, ' '), true);

        addSection('Medications');
        addLine('Medication Round:', log.add_medication_round);
        addLine('Outcome:', log.medication_round_outcome, true);
        if (log.medication_concerns && log.medication_concerns !== 'no') {
          addLine('Medication Concerns:', log.medication_concerns);
          addLine('Details:', log.medication_concerns_details, true);
        }

        if (log.healthcare_visit_required && log.healthcare_visit_required !== 'no') {
          addSection('Healthcare');
          addLine('Healthcare Visit Required:', log.healthcare_visit_required);
          addLine('Type:', log.healthcare_visit_type, true);
        }

        if (log.further_concerns && log.further_concerns !== 'no') {
          addSection('Concerns & Incidents');
          addLine('Further Concerns:', log.further_concerns);
          addLine('Details:', log.further_concerns_details, true);
        }

        // Body map markers
        if (log.body_map_markers && Array.isArray(log.body_map_markers) && log.body_map_markers.length > 0) {
          addSection('Body Map Markers');
          log.body_map_markers.forEach((marker: any, idx: number) => {
            const side = marker.side === 'front' ? 'Front' : 'Back';
            const region = getBodyRegion(marker.x, marker.y);
            const note = marker.note ? ` — ${marker.note}` : '';
            addLine(`${idx + 1}.`, `${side} body, ${region}${note}`);
          });
        }

        if (log.extended_notes) {
          addSection('Extended Notes');
          if (yPosition > pageHeight - 30) { doc.addPage(); yPosition = margin; }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const wrapped = doc.splitTextToSize(log.extended_notes, pageWidth - margin * 2 - 8);
          wrapped.forEach(line => {
            if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = margin; }
            doc.text(line, margin + 8, yPosition);
            yPosition += 5;
          });
        }

        // Custom fields from form builder
        if (log.custom_fields && typeof log.custom_fields === 'object') {
          for (const [sectionId, fields] of Object.entries(log.custom_fields)) {
            if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) continue;

            let sectionLabel = sectionId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            for (const cfg of formConfigs) {
              const sections = cfg.config?.sections || [];
              const match = sections.find((s: any) => s.id === sectionId && s.type === 'custom');
              if (match) { sectionLabel = match.label || match.name || sectionLabel; break; }
            }

            addSection(sectionLabel);

            for (const [fieldId, value] of Object.entries(fields as Record<string, unknown>)) {
              if (value === null || value === undefined || value === '') continue;

              let fieldLabel = fieldId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) + ':';
              for (const cfg of formConfigs) {
                const sections = cfg.config?.sections || [];
                const section = sections.find((s: any) => s.id === sectionId);
                if (section?.fields) {
                  const fieldMatch = section.fields.find((f: any) => f.id === fieldId);
                  if (fieldMatch) { fieldLabel = (fieldMatch.label || fieldLabel) + ':'; break; }
                }
              }

              const displayValue = Array.isArray(value) ? (value as any[]).join(', ') : String(value);
              addLine(fieldLabel, displayValue);
            }
          }
        }

      } else if (logType === 'healthcare') {
        addSection('Visit Details');
        addLine('Visitor:', log.visitor_name);
        addLine('Type:', log.visit_type);
        addLine('Recorded by:', log.recorded_by_name);
        if (log.notes) {
          addSection('Notes');
          const wrapped = doc.splitTextToSize(log.notes, pageWidth - margin * 2 - 8);
          wrapped.forEach((line: string) => {
            if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = margin; }
            doc.text(line, margin + 8, yPosition);
            yPosition += 5;
          });
        }
      }

      // Footer on each log page
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(`${clientName}  |  ${logType === 'care' ? 'Care Log' : 'Communication Log'}  |  ${log.visit_date || log.date}  |  Page ${index + 2}`, margin, pageHeight - 8);
      doc.setTextColor(0, 0, 0);
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${(serviceUser?.full_name || serviceUserName || 'client').replace(/\s+/g, '-')}_${logType}_logs_${startDate}_to_${endDate}.pdf"`,
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
