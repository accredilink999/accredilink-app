import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const { email, name, chatHistory } = await request.json();

    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email is required.' }, { status: 400 });
    }

    // Build a readable summary of the chat
    const summary = (chatHistory || [])
      .map((m) => `${m.from === 'user' ? 'Visitor' : 'AI'}: ${m.text}`)
      .join('\n');

    // Save to contact_submissions
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name: (name || 'Chat Visitor').trim(),
        email: email.trim(),
        subject: 'AI Chat Escalation',
        message: `Chat escalation — visitor requested human follow-up.\n\n--- Chat Transcript ---\n${summary}`,
        form_type: 'chat-escalation',
      });

    if (insertError) {
      console.error('Chat escalation insert error:', insertError);
    }

    // Send email notification via edge function
    try {
      await fetch(`${SUPABASE_URL}/functions/v1/carecallai-contact-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          name: name || 'Chat Visitor',
          email,
          message: `A website visitor requested follow-up from the AI chat.\n\nChat transcript:\n${summary}`,
          department: 'support',
          notifyEmail: 'support@carecallai.co.uk',
        }),
      });
    } catch (emailErr) {
      console.error('Escalation email failed:', emailErr);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error('Chat escalate error:', err);
    return Response.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
