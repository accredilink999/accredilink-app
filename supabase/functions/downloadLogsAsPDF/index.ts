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
    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' } })
  }
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } })
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { serviceUserId, serviceUserName, logType, startDate, endDate } = body;

    if (!serviceUserId || !logType || !startDate || !endDate) {
      return Response.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    let logs = [];
    if (logType === 'care') {
      logs = await (async () => { const { data, error } = await supabase.from('care_logs').select('*'); if (error) throw error; return data || [] })();
    } else if (logType === 'healthcare') {
      logs = await (async () => { const { data, error } = await supabase.from('healthcare_logs').select('*'); if (error) throw error; return data || [] })();
    }

    // Filter by date range
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filteredLogs = logs.filter(log => {
      const logDate = new Date(log.visit_date || log.date);
      return logDate >= start && logDate <= end;
    });

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

    // Header
    doc.setFontSize(18);
    doc.text(logType === 'care' ? 'Care Logs Report' : 'Communication Logs Report', 20, 20);

    doc.setFontSize(11);
    doc.text(`Client: ${serviceUserName}`, 20, 30);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 20, 37);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 44);

    let yPosition = 55;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;

    filteredLogs.forEach((log, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }

      // Log header with date
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text(`Entry ${index + 1} - ${log.visit_date || log.date}`, margin, yPosition);
      yPosition += 7;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);

      // Log details
      if (logType === 'care') {
        doc.text(`Staff: ${log.staff_name || 'N/A'}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Status: ${log.status || 'N/A'}`, margin, yPosition);
        yPosition += 5;
        if (log.mood) {
          doc.text(`Mood: ${log.mood}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.food_intake) {
          doc.text(`Food Intake: ${log.food_intake}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.fluid_intake) {
          doc.text(`Fluid Intake: ${log.fluid_intake}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.welfare_impression_on_arrival) {
          doc.text(`Welfare Impression: ${log.welfare_impression_on_arrival.replace(/_/g, ' ')}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.personal_care) {
          doc.text(`Personal Care: ${log.personal_care}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.personal_care_description) {
          const wrappedPC = doc.splitTextToSize(`  Details: ${log.personal_care_description}`, 170);
          wrappedPC.forEach(line => { if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; } doc.text(line, margin, yPosition); yPosition += 5; });
        }
        if (log.continence_care_provided) {
          doc.text(`Continence Care: ${log.continence_care_provided}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.catheter_care_provided) {
          doc.text(`Catheter Care: ${log.catheter_care_provided}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.catheter_care_description) {
          const wrappedCC = doc.splitTextToSize(`  Details: ${log.catheter_care_description}`, 170);
          wrappedCC.forEach(line => { if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; } doc.text(line, margin, yPosition); yPosition += 5; });
        }
        if (log.repositioned_on_visit) {
          doc.text(`Repositioned: ${log.repositioned_on_visit}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.skincare_provided) {
          doc.text(`Skincare: ${log.skincare_provided}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.skin_integrity_concerns) {
          doc.text(`Skin Integrity Concerns: ${log.skin_integrity_concerns}`, margin, yPosition);
          yPosition += 5;
        }
        // Body map markers
        if (log.body_map_markers && Array.isArray(log.body_map_markers) && log.body_map_markers.length > 0) {
          if (yPosition > pageHeight - 30) { doc.addPage(); yPosition = 20; }
          doc.setFont('helvetica', 'bold');
          doc.text('Body Map Markers:', margin, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          log.body_map_markers.forEach((marker: any, idx: number) => {
            if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
            const side = marker.side === 'front' ? 'Front' : 'Back';
            const region = getBodyRegion(marker.x, marker.y);
            const note = marker.note ? ` - ${marker.note}` : '';
            doc.text(`  ${idx + 1}. ${side} - ${region}${note}`, margin, yPosition);
            yPosition += 5;
          });
        }
        if (log.food_offered) {
          doc.text(`Food Offered: ${log.food_offered}`, margin, yPosition);
          yPosition += 5;
          if (log.food_accepted) {
            doc.text(`  Accepted: ${log.food_accepted}`, margin, yPosition);
            yPosition += 5;
          }
          if (log.food_given) {
            doc.text(`  What Was Given: ${log.food_given}`, margin, yPosition);
            yPosition += 5;
          }
          if (log.food_outcome) {
            doc.text(`  Outcome: ${log.food_outcome.replace(/_/g, ' ')}`, margin, yPosition);
            yPosition += 5;
          }
        }
        if (log.drinks_offered) {
          doc.text(`Drinks Offered: ${log.drinks_offered}`, margin, yPosition);
          yPosition += 5;
          if (log.drinks_accepted) {
            doc.text(`  Accepted: ${log.drinks_accepted}`, margin, yPosition);
            yPosition += 5;
          }
          if (log.drinks_given) {
            doc.text(`  What Was Given: ${log.drinks_given}`, margin, yPosition);
            yPosition += 5;
          }
          if (log.drinks_outcome) {
            doc.text(`  Outcome: ${log.drinks_outcome.replace(/_/g, ' ')}`, margin, yPosition);
            yPosition += 5;
          }
        }
        if (log.add_medication_round) {
          doc.text(`Medication Round: ${log.add_medication_round}`, margin, yPosition);
          yPosition += 5;
          if (log.medication_round_outcome) {
            doc.text(`  Outcome: ${log.medication_round_outcome}`, margin, yPosition);
            yPosition += 5;
          }
        }
        if (log.medication_concerns && log.medication_concerns !== 'no') {
          doc.text(`Medication Concerns: ${log.medication_concerns}`, margin, yPosition);
          yPosition += 5;
          if (log.medication_concerns_details) {
            const wrappedMC = doc.splitTextToSize(`  Details: ${log.medication_concerns_details}`, 170);
            wrappedMC.forEach(line => { if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; } doc.text(line, margin, yPosition); yPosition += 5; });
          }
        }
        if (log.healthcare_visit_required && log.healthcare_visit_required !== 'no') {
          doc.text(`Healthcare Visit Required: ${log.healthcare_visit_required}`, margin, yPosition);
          yPosition += 5;
          if (log.healthcare_visit_type) {
            doc.text(`  Type: ${log.healthcare_visit_type}`, margin, yPosition);
            yPosition += 5;
          }
        }
        if (log.further_concerns && log.further_concerns !== 'no') {
          doc.text(`Further Concerns: ${log.further_concerns}`, margin, yPosition);
          yPosition += 5;
          if (log.further_concerns_details) {
            const wrappedFC = doc.splitTextToSize(`  Details: ${log.further_concerns_details}`, 170);
            wrappedFC.forEach(line => { if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; } doc.text(line, margin, yPosition); yPosition += 5; });
          }
        }
        if (log.extended_notes) {
          doc.text('Extended Notes:', margin, yPosition);
          yPosition += 5;
          const wrappedEN = doc.splitTextToSize(log.extended_notes, 170);
          wrappedEN.forEach(line => { if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; } doc.text(line, margin + 5, yPosition); yPosition += 5; });
        }
        if (log.staff_grade) {
          doc.text(`Staff Grade: ${log.staff_grade}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.double_handed_call) {
          doc.text(`Double Handed Call: ${log.double_handed_call}`, margin, yPosition);
          yPosition += 5;
        }
        if (log.observations) {
          doc.text('Observations:', margin, yPosition);
          yPosition += 5;
          const wrappedText = doc.splitTextToSize(log.observations, 170);
          wrappedText.forEach(line => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          });
        }

        // Custom fields from form builder
        if (log.custom_fields && typeof log.custom_fields === 'object') {
          for (const [sectionId, fields] of Object.entries(log.custom_fields)) {
            if (!fields || typeof fields !== 'object' || Object.keys(fields).length === 0) continue;

            if (yPosition > pageHeight - 30) { doc.addPage(); yPosition = 20; }

            // Find section label from form configs
            let sectionLabel = sectionId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            for (const cfg of formConfigs) {
              const sections = cfg.config?.sections || [];
              const match = sections.find(s => s.id === sectionId && s.type === 'custom');
              if (match) { sectionLabel = match.label || match.name || sectionLabel; break; }
            }

            doc.setFont('helvetica', 'bold');
            doc.text(`${sectionLabel}:`, margin, yPosition);
            yPosition += 5;
            doc.setFont('helvetica', 'normal');

            for (const [fieldId, value] of Object.entries(fields)) {
              if (value === null || value === undefined || value === '') continue;

              // Find field label from form configs
              let fieldLabel = fieldId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
              for (const cfg of formConfigs) {
                const sections = cfg.config?.sections || [];
                const section = sections.find(s => s.id === sectionId);
                if (section?.fields) {
                  const fieldMatch = section.fields.find(f => f.id === fieldId);
                  if (fieldMatch) { fieldLabel = fieldMatch.label || fieldLabel; break; }
                }
              }

              const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
              const line = `  ${fieldLabel}: ${displayValue}`;
              const wrappedCF = doc.splitTextToSize(line, 170);
              wrappedCF.forEach(l => {
                if (yPosition > pageHeight - 20) { doc.addPage(); yPosition = 20; }
                doc.text(l, margin, yPosition);
                yPosition += 5;
              });
            }
          }
        }
      } else if (logType === 'healthcare') {
        doc.text(`Visitor: ${log.visitor_name || 'N/A'}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Type: ${log.visit_type || 'N/A'}`, margin, yPosition);
        yPosition += 5;
        doc.text(`Recorded by: ${log.recorded_by_name || 'N/A'}`, margin, yPosition);
        yPosition += 5;
        if (log.notes) {
          doc.text('Notes:', margin, yPosition);
          yPosition += 5;
          const wrappedText = doc.splitTextToSize(log.notes, 170);
          wrappedText.forEach(line => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, margin + 5, yPosition);
            yPosition += 5;
          });
        }
      }

      yPosition += 8;
    });

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${serviceUserName}_${logType}_logs_${startDate}_to_${endDate}.pdf"`
      }
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
