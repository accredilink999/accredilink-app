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

        const { title, date, attendees, agenda, notes, action_items, next_meeting } = await req.json();

        // Create PDF
        const doc = new jsPDF();
        let y = 20;

        // Header
        doc.setFontSize(22);
        doc.text('Meeting Notes', 20, y);
        y += 15;

        // Meeting Info
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Title: ${title}`, 20, y);
        y += 8;
        
        doc.setFont(undefined, 'normal');
        doc.text(`Date: ${date}`, 20, y);
        y += 6;
        doc.text(`Documented by: ${user.full_name}`, 20, y);
        y += 12;

        // Attendees
        if (attendees && attendees.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Attendees:', 20, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            
            attendees.forEach(attendee => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`â€¢ ${attendee}`, 25, y);
                y += 5;
            });
            y += 8;
        }

        // Agenda
        if (agenda && agenda.length > 0) {
            doc.setFont(undefined, 'bold');
            doc.text('Agenda:', 20, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            
            agenda.forEach((item, index) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${item}`, 25, y);
                y += 5;
            });
            y += 8;
        }

        // Meeting Notes
        if (notes) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.text('Discussion Notes:', 20, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            
            const noteLines = doc.splitTextToSize(notes, 170);
            noteLines.forEach(line => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 20, y);
                y += 5;
            });
            y += 8;
        }

        // Action Items
        if (action_items && action_items.length > 0) {
            if (y > 250) {
                doc.addPage();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.text('Action Items:', 20, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            
            action_items.forEach((item, index) => {
                if (y > 265) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(`${index + 1}. ${item.task}`, 25, y);
                y += 5;
                if (item.assigned_to) {
                    doc.setFontSize(9);
                    doc.text(`   Assigned to: ${item.assigned_to}`, 25, y);
                    y += 4;
                    doc.setFontSize(10);
                }
                if (item.due_date) {
                    doc.setFontSize(9);
                    doc.text(`   Due: ${item.due_date}`, 25, y);
                    y += 4;
                    doc.setFontSize(10);
                }
                y += 2;
            });
            y += 8;
        }

        // Next Meeting
        if (next_meeting) {
            if (y > 260) {
                doc.addPage();
                y = 20;
            }
            doc.setFont(undefined, 'bold');
            doc.text('Next Meeting:', 20, y);
            y += 6;
            doc.setFont(undefined, 'normal');
            doc.text(next_meeting, 25, y);
        }

        const pdfBytes = doc.output('arraybuffer');

        return new Response(pdfBytes, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="meeting-notes-${title.replace(/\s+/g, '-')}-${date}.pdf"`
            }
        });
    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});
