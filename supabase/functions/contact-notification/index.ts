import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

const NOTIFY_EMAIL = 'enquiries@accredilinkcare.co.uk';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { name, email, phone, subject, message, form_type, best_time } = await req.json();

    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.ionos.co.uk';
    const smtpUser = Deno.env.get('SMTP_USER') || '';
    const smtpPass = Deno.env.get('SMTP_PASS') || '';

    if (!smtpUser || !smtpPass) {
      throw new Error('SMTP credentials not configured');
    }

    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: 465,
        tls: true,
        auth: { username: smtpUser, password: smtpPass },
      },
    });

    const isCallback = form_type === 'callback';

    const emailSubject = isCallback
      ? `Callback Request from ${name}`
      : `Website Enquiry: ${subject} — from ${name}`;

    const html = isCallback
      ? `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
           <div style="background:#f0fdfa;padding:20px;border-radius:8px;border-left:4px solid #14b8a6;">
             <h2 style="color:#115e59;margin:0 0 16px;">New Callback Request</h2>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Phone:</strong> ${phone}</p>
             <p><strong>Best Time:</strong> ${best_time || 'Anytime'}</p>
           </div>
           <p style="color:#64748b;font-size:12px;margin-top:20px;">Submitted via accredilinkcare.co.uk</p>
         </div>`
      : `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
           <div style="background:#f0fdfa;padding:20px;border-radius:8px;border-left:4px solid #14b8a6;">
             <h2 style="color:#115e59;margin:0 0 16px;">New Website Enquiry</h2>
             <p><strong>Name:</strong> ${name}</p>
             <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
             ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
             <p><strong>Subject:</strong> ${subject}</p>
             <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/>
             <p><strong>Message:</strong></p>
             <p style="white-space:pre-wrap;">${(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
           </div>
           <p style="color:#64748b;font-size:12px;margin-top:20px;">Submitted via accredilinkcare.co.uk — reply directly to ${email}</p>
         </div>`;

    await client.send({
      from: `"Accredilink Website" <${smtpUser}>`,
      to: NOTIFY_EMAIL,
      replyTo: email || undefined,
      subject: emailSubject,
      content: 'auto',
      html,
    });

    await client.close();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Contact notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
