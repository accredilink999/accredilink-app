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

    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const body: any = {
      from: from || 'CareCallAI <hello@carecallai.co.uk>',
      to: [to],
      subject,
      html,
    };

    if (replyTo) {
      body.reply_to = [replyTo];
    }

    if (listUnsubscribe) {
      body.headers = {
        'List-Unsubscribe': `<${listUnsubscribe}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Resend API error (${res.status})`);
    }

    const result = await res.json();
    return Response.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('Campaign email send error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
