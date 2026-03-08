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

    const { report_id, service_user_name } = await req.json();

    if (!report_id) {
      return Response.json({ error: 'Missing report_id' }, { status: 400 });
    }

    // Fetch the report
    const { data: report, error: reportError } = await supabase
      .from('healthcare_logs')
      .select('*')
      .eq('id', report_id)
      .single();
    if (reportError || !report) {
      return Response.json({ error: 'Report not found' }, { status: 404 });
    }

    // Parse stored report content
    let groupedLogs;
    try {
      const reportData = JSON.parse(report.report_content);
      groupedLogs = reportData.groupedLogs || {
        food_drink: [],
        mood: [],
        concerns: [],
        compliments: []
      };
    } catch (e) {
      // Fallback if content is not JSON
      return Response.json({ error: 'Invalid report content' }, { status: 400 });
    }

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
    doc.text(`Client: ${service_user_name || 'Unknown'}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Date: ${new Date(report.report_date).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Generated: ${new Date(report.created_date).toLocaleString('en-GB')}`, margin, yPosition);
    yPosition += 6;
    doc.text(`By: ${report.recorded_by_name}`, margin, yPosition);
    yPosition += 10;

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

        logs.forEach((log) => {
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

        yPosition += 5;
      }
    }

    const pdfBytes = doc.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Daily_Report_${service_user_name}_${report.report_date}.pdf"`
      }
    });
  } catch (error) {
    console.error('Error downloading report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
