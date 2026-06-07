import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

function getItemStatus(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (typeof val === 'object' && val !== null && 'status' in val) return (val as { status: string }).status;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    });
  }

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assessmentId, sectionIndex } = await req.json();
    if (!assessmentId || sectionIndex === undefined) {
      return Response.json({ error: 'Missing assessmentId or sectionIndex' }, { status: 400 });
    }

    // Fetch assessment
    const { data: assessment, error: aErr } = await supabaseAdmin
      .from('competency_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();
    if (aErr || !assessment) {
      return Response.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Fetch framework
    const { data: framework, error: fErr } = await supabaseAdmin
      .from('competency_frameworks')
      .select('*')
      .eq('id', assessment.framework_id)
      .single();
    if (fErr || !framework) {
      return Response.json({ error: 'Framework not found' }, { status: 404 });
    }

    const section = (framework.sections || [])[sectionIndex];
    if (!section) {
      return Response.json({ error: 'Section not found' }, { status: 404 });
    }

    // Verify all items in the section are met
    const sectionResponses = assessment.responses?.sections?.[sectionIndex]?.items || {};
    const allMet = (section.items || []).every((_: unknown, ii: number) =>
      getItemStatus(sectionResponses[ii]) === 'met'
    );
    if (!allMet) {
      return Response.json({ error: 'Section is not fully met' }, { status: 400 });
    }

    // Find latest observation date across items in this section
    const dates = Object.values(sectionResponses)
      .map((v: unknown) => (typeof v === 'object' && v !== null && 'observation_date' in v)
        ? (v as { observation_date: string }).observation_date
        : null)
      .filter(Boolean) as string[];
    const latestDate = dates.sort().pop() || new Date().toISOString().split('T')[0];

    const certNumber = `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    const issueDate = new Date(latestDate);
    const issueDateFormatted = issueDate.toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
    const generatedDateFormatted = new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' });

    const staffName = assessment.staff_name || 'Staff Member';
    const mentorName = assessment.mentor_name || 'Mentor';
    const sectionTitle = section.title || `Section ${sectionIndex + 1}`;
    const frameworkTitle = framework.title || 'Care Clinician Skills Competency Framework';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Competency Certificate — ${sectionTitle}</title>
<style>
  @media print { body { margin: 0; } .no-print { display: none; } }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Georgia', 'Times New Roman', serif; background: #f5f5f5; display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
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
  .section-name { font-size: 22px; color: #333; font-weight: bold; margin-bottom: 8px; }
  .framework-name { font-size: 13px; color: #0f766e; letter-spacing: 0.5px; margin-bottom: 24px; font-style: italic; }
  .desc { font-size: 13px; color: #666; line-height: 1.6; max-width: 600px; margin: 0 auto 24px; }
  .mentor-block { margin-top: 20px; }
  .mentor-sig { border-top: 1px solid #0f766e; display: inline-block; padding-top: 6px; min-width: 200px; }
  .mentor-sig-name { font-size: 15px; color: #333; font-style: italic; }
  .mentor-sig-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
  .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
  .footer-item { text-align: center; }
  .footer-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 1px; }
  .footer-value { font-size: 13px; color: #333; margin-top: 4px; font-weight: 600; }
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
      <div class="subtitle">of Competency</div>
    </div>
    <div class="body">
      <div class="presented">This is to certify that</div>
      <div class="name">${staffName}</div>
      <div class="course-label">has successfully demonstrated competency in</div>
      <div class="section-name">${sectionTitle}</div>
      <div class="framework-name">${frameworkTitle}</div>
      <div class="desc">
        Having met all required competency criteria for this section, with each item assessed, observed, and verified by their designated mentor. All standards have been demonstrated to the required level.
      </div>
      <div class="mentor-block">
        <div class="mentor-sig">
          <div class="mentor-sig-name">${mentorName}</div>
          <div class="mentor-sig-label">Mentor / Assessor</div>
        </div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-item">
        <div class="footer-value">${issueDateFormatted}</div>
        <div class="footer-label">Date of Assessment</div>
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
    <div style="text-align:center;margin-top:12px;font-size:11px;color:#aaa;">Generated ${generatedDateFormatted}</div>
  </div>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>
</div>
</body>
</html>`;

    const fileName = `certificates/competency_${certNumber}.html`;
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('uploads')
      .upload(fileName, new TextEncoder().encode(html), {
        contentType: 'text/html',
        upsert: true,
      });

    if (uploadError) throw uploadError;

    const certUrl = uploadData?.path
      ? `${supabaseUrl}/storage/v1/object/public/uploads/${uploadData.path}`
      : null;
    if (!certUrl) throw new Error('Upload succeeded but URL is empty');

    // Store in training_certificates for searchable records
    await supabaseAdmin.from('training_certificates').insert({
      staff_id: assessment.staff_id,
      staff_name: staffName,
      training_name: `${sectionTitle} — ${frameworkTitle}`,
      certificate_number: certNumber,
      issued_date: new Date().toISOString().split('T')[0],
      file_url: certUrl,
      status: 'valid',
    }).select().single();

    // Write URL back into the assessment responses so the frontend can display it
    const updatedResponses = {
      ...(assessment.responses || {}),
      sections: {
        ...(assessment.responses?.sections || {}),
        [sectionIndex]: {
          ...(assessment.responses?.sections?.[sectionIndex] || {}),
          certificate_url: certUrl,
          certificate_number: certNumber,
          certificate_issued_at: new Date().toISOString(),
        },
      },
    };
    await supabaseAdmin
      .from('competency_assessments')
      .update({ responses: updatedResponses, updated_at: new Date().toISOString() })
      .eq('id', assessmentId);

    // ── Create a matrix entry so the cert appears in the skills matrix ──
    // Find or create the matrix column for this section
    const orgId = assessment.organization_id;
    let columnId: string | null = null;
    const { data: existingCol } = await supabaseAdmin
      .from('staff_matrix_columns')
      .select('id')
      .eq('matrix_type', 'skills')
      .eq('title', sectionTitle)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (existingCol) {
      columnId = existingCol.id;
    } else {
      const { data: newCol, error: colErr } = await supabaseAdmin
        .from('staff_matrix_columns')
        .insert({
          organization_id: orgId,
          matrix_type: 'skills',
          title: sectionTitle,
          sort_order: sectionIndex,
        })
        .select('id')
        .single();
      if (!colErr && newCol) columnId = newCol.id;
    }

    if (columnId) {
      await supabaseAdmin.from('staff_matrix_entries').upsert({
        organization_id: orgId,
        staff_id: assessment.staff_id,
        column_id: columnId,
        matrix_type: 'skills',
        record_date: new Date().toISOString().split('T')[0],
        document_url: certUrl,
        document_name: `${sectionTitle} Certificate.html`,
        notes: `Competency certificate for ${sectionTitle}. Assessed by ${mentorName}.`,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'staff_id,column_id' });
    }

    return Response.json({
      success: true,
      certificate_url: certUrl,
      certificate_number: certNumber,
    });

  } catch (error) {
    console.error('Competency certificate generation error:', error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
});
