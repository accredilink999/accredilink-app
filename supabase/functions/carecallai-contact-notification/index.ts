import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts';

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
    const { name, email, company, phone, message, agencySize, department, notifyEmail } = await req.json();

    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.ionos.co.uk';
    // Use hello@ as the sending account for carecallai
    const smtpUser = 'hello@carecallai.co.uk';
    const smtpPass = Deno.env.get('CARECALLAI_SMTP_PASS') || '';

    if (!smtpPass) {
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

    const deptLabel = department === 'support' ? 'Support' : department === 'billing' ? 'Billing' : 'General';

    const emailSubject = `CareCallAI Enquiry (${deptLabel}) — from ${name}`;

    const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#f0fdfa;padding:20px;border-radius:8px;border-left:4px solid #0d9488;">
        <h2 style="color:#115e59;margin:0 0 16px;">New CareCallAI Enquiry</h2>
        <p><strong>Department:</strong> ${deptLabel}</p>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
        ${agencySize ? `<p><strong>Agency Size:</strong> ${agencySize}</p>` : ''}
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;"/>
        <p><strong>Message:</strong></p>
        <p style="white-space:pre-wrap;">${(message || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
      </div>
      <p style="color:#64748b;font-size:12px;margin-top:20px;">Submitted via carecallai.co.uk — reply directly to ${email}</p>
    </div>`;

    await client.send({
      from: `"CareCallAI" <${smtpUser}>`,
      to: notifyEmail || 'hello@carecallai.co.uk',
      replyTo: email || undefined,
      subject: emailSubject,
      content: 'auto',
      html,
    });

    await client.close();

    return Response.json({ success: true });
  } catch (error) {
    console.error('CareCallAI contact notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
