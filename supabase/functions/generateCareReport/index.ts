import { createClient } from 'npm:@supabase/supabase-js@2';
import { jsPDF } from 'npm:jspdf@2.5.1';


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

        const { service_user_id, start_date, end_date } = await req.json();

        // Get service user details
        const serviceUsers = await (async () => { const { data, error } = await supabase.from('service_users').select('*'); if (error) throw error; return data || [] })();
        if (!serviceUsers.length) {
            return Response.json({ error: 'Service user not found' }, { status: 404 });
        }

        const serviceUser = serviceUsers[0];

        // Get completed shifts in date range
        const allShifts = await supabase.entities.Shift.list('-date', 500);
        const shifts = allShifts.filter(s => 
            s.service_user_id === service_user_id &&
            s.status === 'completed' &&
            s.date >= start_date &&
            s.date <= end_date
        );

        // Create PDF
        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(20);
        doc.text('Care Report', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, y);
        y += 7;
        doc.text(`Report Period: ${start_date} to ${end_date}`, 20, y);
        y += 15;

        // Service User Info
        doc.setFontSize(14);
        doc.text('Service User Information', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.text(`Name: ${serviceUser.full_name}`, 20, y);
        y += 6;
        doc.text(`Date of Birth: ${serviceUser.date_of_birth || 'N/A'}`, 20, y);
        y += 6;
        doc.text(`Address: ${serviceUser.address}`, 20, y);
        y += 12;

        // Care Logs Summary
        doc.setFontSize(14);
        doc.text(`Care Visits (${shifts.length} total)`, 20, y);
        y += 8;

        doc.setFontSize(10);
        shifts.forEach((shift, index) => {
            if (y > 270) {
                doc.addPage();
                y = 20;
            }

            doc.setFont(undefined, 'bold');
            doc.text(`Visit ${index + 1} - ${shift.date}`, 20, y);
            y += 6;

            doc.setFont(undefined, 'normal');
            doc.text(`Staff: ${shift.staff_name}`, 25, y);
            y += 5;
            doc.text(`Time: ${shift.start_time} - ${shift.end_time}`, 25, y);
            y += 5;

            if (shift.mood) {
                doc.text(`Mood: ${shift.mood}`, 25, y);
                y += 5;
            }

            if (shift.food_intake) {
                doc.text(`Food Intake: ${shift.food_intake}`, 25, y);
                y += 5;
            }

            if (shift.fluid_intake) {
                doc.text(`Fluid Intake: ${shift.fluid_intake}`, 25, y);
                y += 5;
            }

            if (shift.food_offered) {
                doc.text(`Food Offered: ${shift.food_offered}`, 25, y);
                y += 5;
                if (shift.food_accepted) { doc.text(`  Accepted: ${shift.food_accepted}`, 25, y); y += 5; }
                if (shift.food_given) { doc.text(`  What Was Given: ${shift.food_given}`, 25, y); y += 5; }
                if (shift.food_outcome) { doc.text(`  Outcome: ${shift.food_outcome.replace(/_/g, ' ')}`, 25, y); y += 5; }
            }

            if (shift.drinks_offered) {
                doc.text(`Drinks Offered: ${shift.drinks_offered}`, 25, y);
                y += 5;
                if (shift.drinks_accepted) { doc.text(`  Accepted: ${shift.drinks_accepted}`, 25, y); y += 5; }
                if (shift.drinks_given) { doc.text(`  What Was Given: ${shift.drinks_given}`, 25, y); y += 5; }
                if (shift.drinks_outcome) { doc.text(`  Outcome: ${shift.drinks_outcome.replace(/_/g, ' ')}`, 25, y); y += 5; }
            }

            if (shift.care_notes) {
                const notes = doc.splitTextToSize(`Notes: ${shift.care_notes}`, 170);
                doc.text(notes, 25, y);
                y += (notes.length * 5);
            }

            y += 8;
        });

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="care-report-${serviceUser.full_name.replace(/\s+/g, '-')}-${start_date}-to-${end_date}.pdf"`
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
