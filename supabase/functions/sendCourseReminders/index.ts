import { createClient } from 'npm:@supabase/supabase-js@2'
import { sendEmail } from '../_shared/sendEmail.ts';


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

    // Admin-only function
    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get all active assignments
    const assignments = await (async () => { const { data, error } = await supabaseAdmin.from('course_assignments').select('*'); if (error) throw error; return data || [] })();

    // Get all completions to check progress
    const completions = await (async () => { const { data, error } = await supabaseAdmin.from('course_completions').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    
    // Get all courses for course details
    const courses = await (async () => { const { data, error } = await supabaseAdmin.from('courses').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const courseMap = Object.fromEntries(courses.map(c => [c.id, c]));

    // Get all users for email addresses
    const users = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const userMap = Object.fromEntries(users.map(u => [u.id, u]));

    const remindersSent = [];

    for (const assignment of assignments) {
      const completion = completions.find(c => 
        c.course_id === assignment.course_id && 
        c.staff_id === assignment.target_id
      );
      
      const course = courseMap[assignment.course_id];
      const assignedUser = userMap[assignment.target_id];

      if (!course || !assignedUser || !assignedUser.email) continue;

      let shouldSendReminder = false;
      let reminderType = '';

      // Check if user hasn't started (no completion record)
      if (!completion && assignment.status === 'pending') {
        const assignedDate = new Date(assignment.assigned_date || assignment.created_date);
        if (assignedDate < threeDaysAgo) {
          shouldSendReminder = true;
          reminderType = 'not_started';
        }
      }

      // Check if user is in progress but inactive
      if (completion && completion.status === 'in_progress') {
        const lastAccessed = new Date(completion.last_accessed || completion.started_date || completion.created_date);
        if (lastAccessed < sevenDaysAgo && completion.progress_percent < 100) {
          shouldSendReminder = true;
          reminderType = 'inactive';
        }
      }

      // Check if due date is approaching (within 3 days)
      if (assignment.due_date) {
        const dueDate = new Date(assignment.due_date);
        const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
        if (dueDate <= threeDaysFromNow && dueDate > now && (!completion || completion.status !== 'completed')) {
          shouldSendReminder = true;
          reminderType = 'due_soon';
        }
      }

      if (shouldSendReminder) {
        let subject = '';
        let body = '';

        switch (reminderType) {
          case 'not_started':
            subject = `Reminder: Start Your Training - ${course.title}`;
            body = `
              <h2>Hello ${assignedUser.staff_full_name || assignedUser.full_name},</h2>
              <p>This is a friendly reminder that you have been assigned the following training course:</p>
              <h3>${course.title}</h3>
              <p>${course.description || ''}</p>
              <p>You haven't started this course yet. Please log in to begin your training.</p>
              ${assignment.due_date ? `<p><strong>Due Date:</strong> ${new Date(assignment.due_date).toLocaleDateString()}</p>` : ''}
              <p>If you have any questions, please contact your administrator.</p>
            `;
            break;

          case 'inactive':
            subject = `Reminder: Continue Your Training - ${course.title}`;
            body = `
              <h2>Hello ${assignedUser.staff_full_name || assignedUser.full_name},</h2>
              <p>We noticed you haven't accessed your training course recently:</p>
              <h3>${course.title}</h3>
              <p><strong>Progress:</strong> ${completion.progress_percent}% complete</p>
              <p>Take a moment to continue your learning and complete this course.</p>
              ${assignment.due_date ? `<p><strong>Due Date:</strong> ${new Date(assignment.due_date).toLocaleDateString()}</p>` : ''}
              <p>If you have any questions, please contact your administrator.</p>
            `;
            break;

          case 'due_soon':
            const daysUntilDue = Math.ceil((new Date(assignment.due_date) - now) / (1000 * 60 * 60 * 24));
            subject = `âš ï¸ Training Due Soon - ${course.title}`;
            body = `
              <h2>Hello ${assignedUser.staff_full_name || assignedUser.full_name},</h2>
              <p><strong>Important:</strong> Your training course is due soon!</p>
              <h3>${course.title}</h3>
              <p><strong>Due Date:</strong> ${new Date(assignment.due_date).toLocaleDateString()} (${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''} remaining)</p>
              ${completion ? `<p><strong>Progress:</strong> ${completion.progress_percent}% complete</p>` : '<p>You haven\'t started this course yet.</p>'}
              <p>Please complete this training before the deadline.</p>
              <p>If you have any questions, please contact your administrator.</p>
            `;
            break;
        }

        try {
          await sendEmail({
            to: assignedUser.email,
            subject: subject,
            body: body
          });

          remindersSent.push({
            user: assignedUser.staff_full_name || assignedUser.full_name,
            email: assignedUser.email,
            course: course.title,
            type: reminderType
          });
        } catch (emailError) {
          console.error(`Failed to send email to ${assignedUser.email}:`, emailError);
        }
      }
    }

    return Response.json({
      success: true,
      remindersSent: remindersSent.length,
      details: remindersSent
    });
  } catch (error) {
    console.error('Course reminder error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
