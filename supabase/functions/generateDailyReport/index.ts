import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@4.0.0';


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

    const { service_user_id, report_date } = await req.json();

    if (!service_user_id || !report_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Fetch service user details
    const serviceUser = await (async () => { const { data, error } = await supabaseAdmin.from('service_users').select('*').eq('id', service_user_id).single(); if (error) throw error; return data })();
    if (!serviceUser) {
      return Response.json({ error: 'Service user not found' }, { status: 404 });
    }

    // Fetch all sitting logs for the day
    const allLogs = await (async () => { const { data, error } = await supabase.from('healthcare_logs').select('*'); if (error) throw error; return data || [] })();

    // Filter logs for the specific date
    const logsForDay = allLogs.filter(log => {
      const logDate = new Date(log.visit_date).toISOString().split('T')[0];
      return logDate === report_date;
    }).sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));

    // Group logs by type
    const groupedLogs = {
      food_drink: [],
      mood: [],
      concerns: [],
      compliments: []
    };

    logsForDay.forEach(log => {
      if (groupedLogs[log.visit_type]) {
        groupedLogs[log.visit_type].push(log);
      }
    });

    // Create PDF
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const maxWidth = doc.internal.pageSize.getWidth() - margin * 2;

    // Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Daily Sitting Log Report', margin, yPosition);
    yPosition += 10;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Client: ${serviceUser.full_name}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Date: ${new Date(report_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Report Generated: ${new Date().toLocaleString('en-GB')}`, margin, yPosition);
    yPosition += 8;

    // Separator line
    doc.setDrawColor(100);
    doc.line(margin, yPosition, doc.internal.pageSize.getWidth() - margin, yPosition);
    yPosition += 10;

    // Log type labels
    const typeLabels = {
      food_drink: 'Food & Drink Log',
      mood: 'Mood Log',
      concerns: 'Concerns Log',
      compliments: 'Complements & Complaints Log'
    };

    // Process each log type
    for (const [logType, logs] of Object.entries(groupedLogs)) {
      if (logs.length > 0) {
        // Check if new page needed
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        // Section header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setFillColor(220, 240, 240);
        doc.rect(margin, yPosition - 5, maxWidth, 8, 'F');
        doc.text(typeLabels[logType], margin + 3, yPosition + 1);
        yPosition += 12;

        // Log entries
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);

        logs.forEach((log, index) => {
          // Check if new page needed
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            yPosition = margin;
          }

          const time = new Date(log.visit_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          
          // Time and staff info
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(40, 120, 130);
          doc.text(`${time} - ${log.visitor_name || 'Unknown'}`, margin, yPosition);
          yPosition += 5;

          // Log content
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          const lines = doc.splitTextToSize(log.notes, maxWidth - 5);
          doc.text(lines, margin + 3, yPosition);
          yPosition += lines.length * 4 + 5;
        });

        yPosition += 5; // Space between sections
      }
    }

    // Footer with staff signature
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    
    if (yPosition > pageHeight - 25) {
      doc.addPage();
      yPosition = margin;
    }

    doc.line(margin, yPosition, margin + 40, yPosition);
    yPosition += 5;
    doc.text(`Generated by: ${user.staff_full_name || user.full_name}`, margin, yPosition);

    // Generate PDF bytes
    const pdfBytes = doc.output('arraybuffer');

    // Build report text content for database
    let reportText = `Daily Sitting Log Report\nDate: ${new Date(report_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;
    
    const typeLabels = {
      food_drink: 'Food & Drink Log',
      mood: 'Mood Log',
      concerns: 'Concerns Log',
      compliments: 'Complements & Complaints Log'
    };

    for (const [logType, logs] of Object.entries(groupedLogs)) {
      if (logs.length > 0) {
        reportText += `\n${typeLabels[logType]}\n${'='.repeat(40)}\n`;
        logs.forEach(log => {
          const time = new Date(log.visit_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
          reportText += `\n${time} - ${log.visitor_name || 'Unknown'}\n${log.notes}\n`;
        });
      }
    }

    // Save report to database with structured log data
    const reportLog = await (async () => { const { data, error } = await supabaseAdmin.from('healthcare_logs').insert({
      service_user_id,
      service_user_name: serviceUser.full_name,
      visit_type: 'daily_report',
      visit_date: new Date().toISOString(),
      report_date,
      notes: reportText,
      recorded_by: user.id,
      recorded_by_name: user.staff_full_name || user.full_name,
      is_daily_report: true,
      report_content: JSON.stringify({
        serviceUserName: serviceUser.full_name,
        reportDate: report_date,
        generatedBy: user.staff_full_name || user.full_name,
        generatedAt: new Date().toISOString(),
        groupedLogs: groupedLogs
      })
    }).select().single(); if (error) throw error; return data })();

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Daily_Report_${serviceUser.full_name}_${report_date}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
