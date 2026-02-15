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

    if (!user?.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const reportDate = new Date().toISOString().split('T')[0];

    // Get all active service users
    const serviceUsers = await (async () => { const { data, error } = await supabaseAdmin.from('service_users').select('*'); if (error) throw error; return data || [] })();

    let generatedCount = 0;

    for (const serviceUser of serviceUsers) {
      const allLogs = await (async () => { const { data, error } = await supabaseAdmin.from('healthcare_logs').select('*'); if (error) throw error; return data || [] })();

      const logsForDay = allLogs.filter(log => {
        const logDate = new Date(log.visit_date).toISOString().split('T')[0];
        return logDate === reportDate;
      }).sort((a, b) => new Date(a.visit_date) - new Date(b.visit_date));

      // Skip if no logs for this day
      if (logsForDay.length === 0) continue;

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

      // Create report text
      const typeLabels = {
        food_drink: 'Food & Drink Log',
        mood: 'Mood Log',
        concerns: 'Concerns Log',
        compliments: 'Complements & Complaints Log'
      };

      let reportText = `Daily Sitting Log Report\nDate: ${new Date(reportDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

      for (const [logType, logs] of Object.entries(groupedLogs)) {
        if (logs.length > 0) {
          reportText += `\n${typeLabels[logType]}\n${'='.repeat(40)}\n`;
          logs.forEach(log => {
            const time = new Date(log.visit_date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            reportText += `\n${time} - ${log.visitor_name || 'Unknown'}\n${log.notes}\n`;
          });
        }
      }

      // Save report to database
      await (async () => { const { data, error } = await supabaseAdmin.from('healthcare_logs').insert({
        service_user_id: serviceUser.id,
        service_user_name: serviceUser.full_name,
        visit_type: 'daily_report',
        visit_date: new Date().toISOString(),
        report_date: reportDate,
        notes: reportText,
        recorded_by: user.id,
        recorded_by_name: user.staff_full_name || user.full_name,
        is_daily_report: true,
        report_content: JSON.stringify({
          serviceUserName: serviceUser.full_name,
          reportDate: reportDate,
          generatedBy: user.staff_full_name || user.full_name,
          generatedAt: new Date().toISOString(),
          groupedLogs: groupedLogs
        })
      }).select().single(); if (error) throw error; return data })();

      generatedCount++;
    }

    return Response.json({ 
      success: true, 
      message: `Generated ${generatedCount} daily reports for ${reportDate}` 
    });
  } catch (error) {
    console.error('Error generating daily reports:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
