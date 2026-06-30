/**
 * sendFirebasePushNotification
 *
 * Sends a push notification via the FCM HTTP v1 API.
 * Uses a Firebase service account (stored in SystemSettings) to authenticate.
 *
 * Called by:
 *   - createNotification (for general push)
 *   - sendChatMessagePushNotification (for chat messages)
 *
 * Accepts (JSON body):
 *   recipient_id  — single user ID (looks up their FCM token from profiles)
 *   recipient_ids — array of user IDs (sends to all who have tokens)
 *   token         — (optional) send directly to this FCM token instead of looking up
 *   title         — notification title
 *   message       — notification body text
 *   data          — (optional) key-value data payload
 *   action_url    — (optional) URL to open on tap
 *   priority      — (optional) 'high' or 'normal'
 *   notification_type — (optional) for logging
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ---------------------------------------------------------------------------
// JWT + OAuth helpers for FCM HTTP v1 API
// ---------------------------------------------------------------------------

/** Convert a PEM-encoded RSA private key to a CryptoKey for signing */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/-----END (?:RSA )?PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

/** Base64url encode */
function b64url(input: Uint8Array | string): string {
  const str = typeof input === 'string' ? input : String.fromCharCode(...input);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Create a signed JWT for Google OAuth2 */
async function createSignedJWT(
  clientEmail: string,
  privateKey: CryptoKey,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = b64url(
    JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
      scope: 'https://www.googleapis.com/auth/firebase.messaging',
    }),
  );

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = new Uint8Array(
    await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, signingInput),
  );

  return `${header}.${payload}.${b64url(signature)}`;
}

/** Exchange a signed JWT for a Google OAuth2 access token */
async function getAccessToken(jwt: string): Promise<string> {
  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`OAuth token exchange failed (${resp.status}): ${text}`);
  }

  const data = await resp.json();
  return data.access_token;
}

/** Send a single FCM v1 message */
async function sendFCMMessage(
  projectId: string,
  accessToken: string,
  fcmToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  priority?: string,
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const isAlerter = data?.type === 'alerter';

  // Alerter messages: data-only for web (no notification field) so firebase-messaging-sw.js
  // handles display exactly once. Android keeps a notification field for native display.
  // Other messages: include notification field for cross-platform auto-display.
  const message: Record<string, unknown> = {
    token: fcmToken,
    android: {
      priority: priority === 'high' ? 'HIGH' : 'NORMAL',
      notification: {
        title,
        body,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        default_vibrate_timings: !isAlerter,
        default_sound:           !isAlerter,
        ...(isAlerter ? {
          vibrate_timings: ['0.3s', '0.1s', '0.3s', '0.1s', '0.3s', '0.1s', '0.3s'],
          sound: 'default',
          channel_id: 'carecall_alerter',
        } : {}),
      },
    },
    webpush: {
      headers: { Urgency: priority === 'high' ? 'high' : 'normal' },
      // NO webpush.notification for alerter → data-only on web → onBackgroundMessage fires once
      ...(!isAlerter ? {
        notification: {
          icon: '/pwa-192x192.png',
          badge: '/pwa-64x64.png',
          vibrate: [200, 100, 200],
          requireInteraction: priority === 'high' || priority === 'critical',
        },
      } : {}),
    },
  };

  // Non-alerter messages get top-level notification for cross-platform auto-display
  if (!isAlerter) {
    (message as any).notification = { title, body };
  }

  // Build data payload — always include title/body so onBackgroundMessage can show them
  const strData: Record<string, string> = { title, body };
  if (data && Object.keys(data).length > 0) {
    // FCM data values must be strings
    for (const [k, v] of Object.entries(data)) {
      strData[k] = typeof v === 'string' ? v : JSON.stringify(v);
    }
  }
  message.data = strData;

  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[FCM] Send failed (${resp.status}):`, errText);
    return { success: false, error: errText };
  }

  const result = await resp.json();
  return { success: true, messageId: result.name };
}

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------

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
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      recipient_id,
      recipient_ids,
      token: directToken,
      title,
      message,
      body: bodyAlias, // some callers pass 'body' instead of 'message'
      data,
      action_url,
      priority,
      notification_type,
    } = await req.json();

    const notifBody = message || bodyAlias || '';
    const notifTitle = title || 'Notification';

    // ------------------------------------------------------------------
    // 1. Load Firebase service account from SystemSettings
    // ------------------------------------------------------------------
    const { data: saRow } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'firebase_service_account')
      .maybeSingle();

    if (!saRow?.setting_value) {
      console.warn('[FCM] No firebase_service_account in SystemSettings');
      return Response.json({
        success: false,
        error: 'Firebase service account not configured. Admin must add it in Settings → Push Notification Credentials.',
      }, { status: 400 });
    }

    let serviceAccount: { client_email: string; private_key: string; project_id: string };
    try {
      serviceAccount = typeof saRow.setting_value === 'string'
        ? JSON.parse(saRow.setting_value)
        : saRow.setting_value;
    } catch {
      return Response.json({ success: false, error: 'Invalid service account JSON' }, { status: 400 });
    }

    if (!serviceAccount.client_email || !serviceAccount.private_key || !serviceAccount.project_id) {
      return Response.json({
        success: false,
        error: 'Service account JSON missing required fields (client_email, private_key, project_id)',
      }, { status: 400 });
    }

    // ------------------------------------------------------------------
    // 2. Get OAuth access token
    // ------------------------------------------------------------------
    const privateKey = await importPrivateKey(serviceAccount.private_key);
    const jwt = await createSignedJWT(serviceAccount.client_email, privateKey);
    const accessToken = await getAccessToken(jwt);

    // ------------------------------------------------------------------
    // 3. Resolve FCM tokens for recipients
    // ------------------------------------------------------------------
    interface TokenEntry { userId: string; token: string }
    const tokensToSend: TokenEntry[] = [];

    if (directToken) {
      tokensToSend.push({ userId: 'direct', token: directToken });
    }

    const userIds = recipient_ids || (recipient_id ? [recipient_id] : []);

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, firebase_messaging_token, fcm_tokens')
        .in('id', userIds);

      if (profiles) {
        for (const p of profiles) {
          // Prefer fcm_tokens array (multi-device) over single firebase_messaging_token
          const tokenArray = Array.isArray(p.fcm_tokens) && p.fcm_tokens.length > 0
            ? p.fcm_tokens
            : null;

          if (tokenArray) {
            for (const entry of tokenArray) {
              if (entry.token) {
                tokensToSend.push({ userId: p.id, token: entry.token });
              }
            }
          } else if (p.firebase_messaging_token) {
            // Fallback to single token for backwards compatibility
            tokensToSend.push({ userId: p.id, token: p.firebase_messaging_token });
          }
        }
      }
    }

    if (tokensToSend.length === 0) {
      return Response.json({
        success: true,
        message: 'No FCM tokens found for recipients — nothing to send',
        sent: 0,
      });
    }

    // ------------------------------------------------------------------
    // 4. Send push notifications
    // ------------------------------------------------------------------
    const dataPayload: Record<string, string> = {
      ...(data || {}),
      ...(action_url ? { url: action_url } : {}),
      ...(notification_type ? { type: notification_type } : {}),
    };

    const results = await Promise.allSettled(
      tokensToSend.map(({ token }) =>
        sendFCMMessage(
          serviceAccount.project_id,
          accessToken,
          token,
          notifTitle,
          notifBody,
          dataPayload,
          priority,
        )
      ),
    );

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.success) {
        sent++;
        console.log(`[FCM] Sent to ${tokensToSend[i].userId}: ${r.value.messageId}`);
      } else {
        failed++;
        const err = r.status === 'fulfilled' ? r.value.error : (r as PromiseRejectedResult).reason?.message;
        errors.push(`${tokensToSend[i].userId}: ${err}`);
        console.error(`[FCM] Failed for ${tokensToSend[i].userId}:`, err);
      }
    });

    return Response.json({
      success: sent > 0,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('sendFirebasePushNotification error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
