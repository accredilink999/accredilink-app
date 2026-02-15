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
  const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !currentUser) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const user = currentUser;

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Retrieve saved Firebase config
    const configSettings = await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').select('*'); if (error) throw error; return data || [] })();

    if (!configSettings || configSettings.length === 0) {
      return Response.json({ 
        success: false, 
        message: 'No Firebase configuration found. Please save the configuration first.' 
      }, { status: 400 });
    }

    let firebaseConfig;
    try {
      firebaseConfig = JSON.parse(configSettings[0].setting_value);
    } catch (e) {
      return Response.json({ 
        success: false, 
        message: 'Invalid Firebase configuration format' 
      }, { status: 400 });
    }

    // Validate required fields
    const requiredFields = ['apiKey', 'projectId', 'storageBucket'];
    const missingFields = requiredFields.filter(field => !firebaseConfig[field]);

    if (missingFields.length > 0) {
      return Response.json({ 
        success: false, 
        message: `Missing required fields: ${missingFields.join(', ')}` 
      }, { status: 400 });
    }

    // Test API key validity by making a request to Firebase
    const testResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }
    );

    if (!testResponse.ok && testResponse.status !== 400) {
      return Response.json({ 
        success: false, 
        message: 'Failed to validate Firebase API key' 
      }, { status: 400 });
    }

    return Response.json({ 
      success: true, 
      message: 'Firebase configuration is valid and connected',
      config: {
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket
      }
    });
  } catch (error) {
    return Response.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
});
