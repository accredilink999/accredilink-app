import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, phone, subject, message, form_type, best_time } = body;

    if (!name || name.trim().length < 2) {
      return Response.json({ error: 'Name is required.' }, { status: 400 });
    }

    if (form_type === 'callback') {
      if (!phone || phone.trim().length < 6) {
        return Response.json({ error: 'Phone number is required for callbacks.' }, { status: 400 });
      }
    } else {
      if (!email || !email.includes('@')) {
        return Response.json({ error: 'Valid email is required.' }, { status: 400 });
      }
      if (!message || message.trim().length < 5) {
        return Response.json({ error: 'Message is required.' }, { status: 400 });
      }
    }

    // Save to database
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        subject: subject || 'general',
        message: message?.trim() || null,
        form_type: form_type || 'contact',
        best_time: best_time || null,
      });

    if (insertError) {
      console.error('Contact submission error:', insertError);
      return Response.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
    }

    // Send email via Supabase edge function (uses Resend — proven working)
    try {
      const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/contact-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ name, email, phone, subject, message, form_type, best_time }),
      });
      if (!emailRes.ok) {
        const errData = await emailRes.text();
        console.error('Edge function email error:', errData);
      }
    } catch (emailErr) {
      console.error('Email notification failed:', emailErr);
    }

    return Response.json({ success: true, message: 'Thank you! We will be in touch shortly.' });
  } catch (err) {
    console.error('Contact API error:', err);
    return Response.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
