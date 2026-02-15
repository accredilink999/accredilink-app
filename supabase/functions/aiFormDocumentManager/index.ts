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

    const { action, data } = await req.json();

    switch (action) {
      case 'listForms': {
        const { data: forms, error } = await supabaseAdmin.from('forms').select('*').order('created_at', { ascending: false }).limit(1000);
        if (error) throw error;
        return Response.json({ forms: forms || [] });
      }

      case 'listDocuments': {
        const { data: documents, error } = await supabaseAdmin.from('documents').select('*').order('created_at', { ascending: false }).limit(1000);
        if (error) throw error;
        return Response.json({ documents: documents || [] });
      }

      case 'createForm': {
        const { data: form, error } = await supabaseAdmin.from('forms').insert({
          title: data.title,
          description: data.description,
          fields: data.schema || {},
          is_active: data.is_published || false,
          created_by: user.id
        }).select().single();
        if (error) throw error;
        return Response.json({ form, message: `Form "${form.title}" created successfully` });
      }

      case 'updateForm': {
        const updateData: Record<string, unknown> = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.schema) updateData.fields = data.schema;
        if (data.is_published !== undefined) updateData.is_active = data.is_published;

        const { data: form, error } = await supabaseAdmin.from('forms').update(updateData).eq('id', data.id).select().single();
        if (error) throw error;
        return Response.json({ form, message: `Form "${form.title}" updated successfully` });
      }

      case 'createDocument': {
        const { data: document, error } = await supabaseAdmin.from('documents').insert({
          title: data.title,
          category: data.category,
          description: data.description,
          file_url: data.file_url,
          file_type: data.file_type,
          uploaded_by: user.id,
          is_public: false
        }).select().single();
        if (error) throw error;
        return Response.json({ document, message: `Document "${document.title}" created successfully` });
      }

      case 'submitForm': {
        const { data: submission, error } = await supabaseAdmin.from('form_submissions').insert({
          form_id: data.form_id,
          submitted_by: user.id,
          submitter_name: user.email,
          data: data.submission_data || {},
          status: 'submitted'
        }).select().single();
        if (error) throw error;
        return Response.json({ submission, message: 'Form submitted successfully' });
      }

      case 'getFormSchema': {
        const { data: form, error } = await supabaseAdmin.from('forms').select('*').eq('id', data.form_id).single();
        if (error) throw error;
        const schema = typeof form.fields === 'string' ? JSON.parse(form.fields) : form.fields;
        return Response.json({ form, schema });
      }

      case 'listFormSubmissions': {
        const { data: submissions, error } = await supabaseAdmin.from('form_submissions').select('*').eq('form_id', data.form_id).order('created_at', { ascending: false }).limit(50);
        if (error) throw error;
        return Response.json({ submissions: submissions || [] });
      }

      case 'deleteForm': {
        await supabaseAdmin.from('forms').delete().eq('id', data.form_id);
        return Response.json({ message: 'Form deleted successfully' });
      }

      case 'deleteDocument': {
        await supabaseAdmin.from('documents').delete().eq('id', data.document_id);
        return Response.json({ message: 'Document deleted successfully' });
      }

      case 'getSystemInfo': {
        const { data: forms } = await supabaseAdmin.from('forms').select('*').order('created_at', { ascending: false }).limit(1000);
        const { data: documents } = await supabaseAdmin.from('documents').select('*').order('created_at', { ascending: false }).limit(1000);
        const { data: formSubmissions } = await supabaseAdmin.from('form_submissions').select('*').order('created_at', { ascending: false }).limit(1000);

        return Response.json({
          formsCount: (forms || []).length,
          documentsCount: (documents || []).length,
          submissionsCount: (formSubmissions || []).length,
          forms: (forms || []).slice(0, 10),
          documents: (documents || []).slice(0, 10),
          recentSubmissions: (formSubmissions || []).slice(0, 5)
        });
      }

      default:
        return Response.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
