import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@2.5.2';


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
