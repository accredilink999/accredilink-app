import { supabase } from '@/lib/supabase';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const DEPARTMENT_EMAILS = {
  general: 'hello@carecallai.co.uk',
  support: 'support@carecallai.co.uk',
  billing: 'billing@carecallai.co.uk',
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, company, phone, message, agencySize, department } = body;

    if (!name || name.trim().length < 2) {
      return Response.json({ error: 'Name is required.' }, { status: 400 });
    }
    if (!email || !email.includes('@')) {
      return Response.json({ error: 'Valid email is required.' }, { status: 400 });
    }
    if (!message || message.trim().length < 5) {
      return Response.json({ error: 'Message is required.' }, { status: 400 });
    }

    // Save to database
    const { error: insertError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        subject: department || 'general',
        message: message.trim(),
        form_type: 'carecallai-contact',
      });

    if (insertError) {
      console.error('Contact submission error:', insertError);
      return Response.json({ error: 'Failed to submit. Please try again.' }, { status: 500 });
    }

    // Send email via Supabase edge function
    const notifyEmail = DEPARTMENT_EMAILS[department] || DEPARTMENT_EMAILS.general;
    try {
      const emailRes = await fetch(`${SUPABASE_URL}/functions/v1/carecallai-contact-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ name, email, company, phone, message, agencySize, department, notifyEmail }),
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
