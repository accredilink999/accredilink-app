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

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, priority = 'high', context } = await req.json();

    if (!message) {
      return Response.json({ error: 'Message is required' }, { status: 400 });
    }

    // Get Slack access token
    const accessToken = await supabaseAdmin.connectors.getAccessToken('slack');

    // Get admin channel (you can configure this in SystemSettings)
    const settings = await (async () => { const { data, error } = await supabaseAdmin.from('system_settings').select('*'); if (error) throw error; return data || [] })();
    const channelId = settings[0]?.setting_value || 'C08UT5K46V6'; // Default channel ID

    // Prepare Slack message with formatting
    const emoji = priority === 'critical' ? 'ðŸš¨' : priority === 'high' ? 'âš ï¸' : 'â„¹ï¸';
    const color = priority === 'critical' ? '#dc2626' : priority === 'high' ? '#ea580c' : '#3b82f6';
    
    let slackMessage = {
      channel: channelId,
      text: `${emoji} *${priority.toUpperCase()} ALERT*`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `${emoji} ${priority.toUpperCase()} Alert`,
            emoji: true
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message
          }
        }
      ]
    };

    // Add context if provided
    if (context) {
      slackMessage.blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `*From:* ${user.full_name || user.email} | *Time:* <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toLocaleString()}>`
          }
        ]
      });

      if (context.incident_id) {
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Incident ID:* ${context.incident_id}`
          }
        });
      }

      if (context.service_user) {
        slackMessage.blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Service User:* ${context.service_user}`
          }
        });
      }
    }

    // Add divider
    slackMessage.blocks.push({ type: 'divider' });

    // Send to Slack
    const response = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(slackMessage)
    });

    const result = await response.json();

    if (!result.ok) {
      throw new Error(`Slack API error: ${result.error}`);
    }

    return Response.json({ 
      success: true, 
      message: 'Alert sent to Slack',
      timestamp: result.ts 
    });

  } catch (error) {
    console.error('Slack alert error:', error);
    return Response.json({ 
      error: error.message || 'Failed to send Slack alert' 
    }, { status: 500 });
  }
});
