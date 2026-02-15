import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { format, startOfWeek, endOfWeek } from 'npm:date-fns@3.6.0';


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

    const { service_user_id, week_start_date } = await req.json();

    if (!service_user_id || !week_start_date) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get service user
    const serviceUser = await supabase.entities.ServiceUser.get(service_user_id);
    if (!serviceUser) {
      return Response.json({ error: 'Service user not found' }, { status: 404 });
    }

    // Parse dates
    const weekStart = new Date(week_start_date);
    const weekEnd = new Date(week_start_date);
    weekEnd.setDate(weekEnd.getDate() + 6);

    // Get medications for the week
    const medications = await (async () => { const { data, error } = await supabase.from('medication_records').select('*'); if (error) throw error; return data || [] })();

    // Get administrations for the week
    const administrations = await (async () => { const { data, error } = await supabase.from('medication_administrations').select('*'); if (error) throw error; return data || [] })();

    // Create PDF
    const doc = new jsPDF({ orientation: 'landscape' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.text(`Medication Administration Record (MAR)`, pageWidth / 2, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.text(`Service User: ${serviceUser.full_name}`, 15, 25);
    doc.text(`Week: ${format(weekStart, 'dd/MM/yyyy')} to ${format(weekEnd, 'dd/MM/yyyy')}`, 15, 32);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 15, 39);

    // Medication table
    let yPos = 50;
    doc.setFontSize(9);

    // Days header
    const dayWidth = (pageWidth - 50) / 7;
    doc.text('Medication', 15, yPos);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + i);
      weekDays.push(day);
      const xPos = 50 + (i * dayWidth);
      doc.text(format(day, 'EEE'), xPos, yPos, { align: 'center' });
      doc.text(format(day, 'd/M'), xPos, yPos + 5, { align: 'center' });
    }

    yPos += 15;

    // Medication rows
    medications.forEach((med, idx) => {
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
      }

      doc.text(`${med.medication_name} ${med.dosage}`, 15, yPos);

      // Check administrations for each day
      weekDays.forEach((day, dayIdx) => {
        const xPos = 50 + (dayIdx * dayWidth);
        const dayStr = format(day, 'yyyy-MM-dd');
        const dayAdmin = administrations.find(
          a => a.medication_record_id === med.id && 
               a.administered_at && 
               a.administered_at.startsWith(dayStr)
        );

        if (dayAdmin) {
          const statusSymbol = dayAdmin.status === 'given' ? 'âœ“' : 
                               dayAdmin.status === 'refused' ? 'R' : 'N/A';
          doc.text(statusSymbol, xPos, yPos, { align: 'center' });
        } else {
          doc.text('â–¡', xPos, yPos, { align: 'center' });
        }
      });

      yPos += 7;
    });

    const pdfBlob = doc.output('blob');
    const pdfArrayBuffer = await pdfBlob.arrayBuffer();
    const pdfBase64 = btoa(String.fromCharCode(...new Uint8Array(pdfArrayBuffer)));

    // Upload to private storage
    const uploadResponse = await supabase.integrations.Core.UploadPrivateFile({
      file: pdfBase64
    });

    // Create archived record
    const archivedChart = await supabase.entities.ArchivedMARChart.create({
      service_user_id: service_user_id,
      service_user_name: serviceUser.full_name,
      week_start_date: format(weekStart, 'yyyy-MM-dd'),
      week_end_date: format(weekEnd, 'yyyy-MM-dd'),
      file_uri: uploadResponse.file_uri,
      generated_at: new Date().toISOString()
    });

    return Response.json({ 
      success: true, 
      archivedChart: archivedChart
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
