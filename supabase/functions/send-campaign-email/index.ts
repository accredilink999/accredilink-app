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
    const { to, from, subject, html, replyTo, listUnsubscribe } = await req.json();

    if (!to || !subject || !html) {
      return Response.json({ error: 'to, subject, and html are required' }, { status: 400 });
    }

    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.ionos.co.uk';
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

    const headers: Record<string, string> = {};
    if (listUnsubscribe) {
      headers['List-Unsubscribe'] = `<${listUnsubscribe}>`;
      headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    }

    await client.send({
      from: from || `"CareCallAI" <${smtpUser}>`,
      to,
      replyTo: replyTo || undefined,
      subject,
      content: 'auto',
      html,
      headers,
    });

    await client.close();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Campaign email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
