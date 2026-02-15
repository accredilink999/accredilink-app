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
    const { event, data } = await req.json();

    if (event.type !== 'create' || event.entity_name !== 'ChatMessage') {
      return Response.json({ success: true });
    }

    const chatMessage = data;

    // Get the conversation
    const conversation = await (async () => { const { data, error } = await supabaseAdmin.from('conversations').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const convo = conversation.find(c => c.id === chatMessage.conversation_id);

    if (!convo || !convo.participants) {
      return Response.json({ success: true });
    }

    // Get all participants' details
    const allUsers = await (async () => { const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false }).limit(1000); if (error) throw error; return data || [] })();
    const recipients = convo.participants
      .filter(participantId => participantId !== chatMessage.sender_id)
      .map(participantId => allUsers.find(u => u.id === participantId))
      .filter(user => user && user.email && user.is_active !== false);

    if (recipients.length === 0) {
      return Response.json({ success: true });
    }

    // Determine conversation name
    const conversationType = convo.type === 'direct' ? 'Direct Message' : `Group: ${convo.name || 'Chat'}`;
    const messagePreview = chatMessage.content?.substring(0, 100) || '[No content]';

    // Send emails to all recipients
    const emailPromises = recipients.map(recipient => {
      const subject = `New ${conversationType} from ${chatMessage.sender_name}`;
      const body = `
You have received a new message in ${conversationType} from ${chatMessage.sender_name}:

"${messagePreview}${chatMessage.content?.length > 100 ? '...' : ''}"

Check your messages to reply.
      `.trim();

      return supabase.integrations.Core.SendEmail({
        to: recipient.email,
        subject: subject,
        body: body
      }).catch(error => {
        console.error(`Failed to send email to ${recipient.email}:`, error.message);
        return null;
      });
    });

    await Promise.all(emailPromises);

    return Response.json({ success: true, emailsSent: recipients.length });
  } catch (error) {
    console.error('Error sending chat message emails:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
