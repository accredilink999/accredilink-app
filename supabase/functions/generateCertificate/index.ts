import { createClient } from 'npm:@supabase/supabase-js@2';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { courseCompletionId } = await req.json();

    if (!courseCompletionId) {
      return Response.json({ error: 'Missing courseCompletionId' }, { status: 400 });
    }

    const { data: completion, error: compError } = await supabaseAdmin
      .from('course_completions')
      .select('*')
      .eq('id', courseCompletionId)
      .single();

    if (compError || !completion) {
      return Response.json({ error: 'Course completion not found' }, { status: 404 });
    }

    const { data: course, error: courseError } = await supabaseAdmin
      .from('courses')
      .select('*')
      .eq('id', completion.course_id)
      .single();

    if (courseError || !course) {
      return Response.json({ error: 'Course not found' }, { status: 404 });
    }

    const certNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const issueDate = new Date();
    const issueDateFormatted = issueDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const expiryDate = course.expiry_days ? new Date(issueDate.getTime() + course.expiry_days * 24 * 60 * 60 * 1000) : null;
    const expiryFormatted = expiryDate ? expiryDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' }) : null;

    const staffName = completion.staff_name || 'Staff Member';

    // Generate professional HTML certificate
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Certificate - ${course.title}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
  .cert { width: 900px; max-width: 100%; background: white; padding: 60px; position: relative; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
  .cert::before { content: ''; position: absolute; inset: 15px; border: 3px double #0f766e; pointer-events: none; }
  .cert::after { content: ''; position: absolute; inset: 20px; border: 1px solid #0f766e; pointer-events: none; }
  .header { text-align: center; margin-bottom: 40px; }
  .logo { font-size: 14px; letter-spacing: 4px; color: #0f766e; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
  .title { font-size: 42px; color: #0f766e; font-weight: normal; letter-spacing: 2px; margin-bottom: 8px; }
  .subtitle { font-size: 16px; color: #666; letter-spacing: 2px; text-transform: uppercase; }
  .body { text-align: center; margin-bottom: 40px; }
  .presented { font-size: 14px; color: #888; margin-bottom: 12px; }
  .name { font-size: 36px; color: #1a1a1a; font-style: italic; margin-bottom: 24px; border-bottom: 2px solid #0f766e; display: inline-block; padding-bottom: 8px; }
  .course-label { font-size: 14px; color: #888; margin-bottom: 8px; }
  .course-name { font-size: 22px; color: #333; font-weight: bold; margin-bottom: 24px; }
  .desc { font-size: 13px; color: #666; line-height: 1.6; max-width: 600px; margin: 0 auto; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; }
  .footer-item { text-align: center; }
  .footer-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .footer-value { font-size: 13px; color: #333; margin-top: 4px; }
  .seal { width: 80px; height: 80px; border: 3px solid #0f766e; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto; }
  .seal-text { font-size: 10px; color: #0f766e; text-align: center; font-weight: bold; letter-spacing: 1px; line-height: 1.3; }
  .print-btn { display: block; margin: 20px auto 0; padding: 12px 32px; background: #0f766e; color: white; border: none; border-radius: 8px; font-size: 16px; cursor: pointer; }
  .print-btn:hover { background: #0d6b63; }
</style>
</head>
<body>
<div>
  <div class="cert">
    <div class="header">
      <div class="logo">Care Call AI</div>
      <div class="title">Certificate</div>
      <div class="subtitle">of Completion</div>
    </div>
    <div class="body">
      <div class="presented">This is to certify that</div>
      <div class="name">${staffName}</div>
      <div class="course-label">has successfully completed the course</div>
      <div class="course-name">${course.title}</div>
      <div class="desc">
        Having demonstrated the required knowledge and understanding of all course modules and learning objectives${completion.score ? `, achieving a score of ${completion.score}%` : ''}.
      </div>
    </div>
    <div class="footer">
      <div class="footer-item">
        <div class="footer-value">${issueDateFormatted}</div>
        <div class="footer-label">Date Issued</div>
      </div>
      <div class="footer-item">
        <div class="seal">
          <div class="seal-text">CARE<br/>CALL<br/>AI</div>
        </div>
      </div>
      <div class="footer-item">
        <div class="footer-value">${certNumber}</div>
        <div class="footer-label">Certificate No.</div>
      </div>
    </div>
    ${expiryFormatted ? `<div style="text-align:center;margin-top:16px;font-size:12px;color:#888;">Valid until: ${expiryFormatted}</div>` : ''}
  </div>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;

    const fileName = `certificates/certificate_${certNumber}.html`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('uploads')
      .upload(fileName, new TextEncoder().encode(html), {
        contentType: 'text/html',
        upsert: true
      });

    const fileUrl = uploadData?.path
      ? `${supabaseUrl}/storage/v1/object/public/uploads/${uploadData.path}`
      : null;

    const { data: certificate, error: certError } = await supabaseAdmin
      .from('training_certificates')
      .insert({
        staff_id: completion.staff_id,
        staff_name: completion.staff_name,
        training_name: course.title,
        certificate_number: certNumber,
        issued_date: issueDate.toISOString().split('T')[0],
        expiry_date: expiryDate ? expiryDate.toISOString().split('T')[0] : null,
        file_url: fileUrl,
        status: 'valid'
      })
      .select()
      .single();

    if (certError) throw certError;

    await supabaseAdmin
      .from('course_completions')
      .update({ certificate_url: fileUrl })
      .eq('id', courseCompletionId);

    return Response.json({ success: true, certificate, certificate_url: fileUrl });
  } catch (error) {
    console.error('Certificate generation error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});
