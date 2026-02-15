/**
 * sendAPNSPushNotification
 *
 * Sends push notifications via Apple Push Notification service (APNs) HTTP/2 API.
 * Uses an APNs Auth Key (.p8) stored in SystemSettings to authenticate.
 *
 * Called by:
 *   - createNotification (when recipient has an APNS token)
 *
 * Accepts (JSON body):
 *   recipient_id  — single user ID
 *   recipient_ids — array of user IDs
 *   title         — notification title
 *   message       — notification body text
 *   data          — (optional) custom data payload
 *   action_url    — (optional) URL to open on tap
 *   priority      — (optional) 'high' or 'normal'
 *   notification_type — (optional) for categorisation
 */

import { createClient } from 'npm:@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

// ---------------------------------------------------------------------------
// JWT helpers for APNs token-based auth
// ---------------------------------------------------------------------------

/** Import a .p8 ES256 private key */
async function importAPNSKey(pem: string): Promise<CryptoKey> {
  const pemBody = pem
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '');

  const binaryDer = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binaryDer.buffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

/** Base64url encode */
function b64url(input: Uint8Array | string): string {
  const str = typeof input === 'string' ? input : String.fromCharCode(...input);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Create a signed JWT for APNs */
async function createAPNSToken(
  keyId: string,
  teamId: string,
  privateKey: CryptoKey,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: 'ES256', kid: keyId }));
  const payload = b64url(JSON.stringify({ iss: teamId, iat: now }));

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      privateKey,
      signingInput,
    ),
  );

  // Convert DER signature to raw r||s format (64 bytes)
  const rawSig = derToRaw(signature);

  return `${header}.${payload}.${b64url(rawSig)}`;
}

/** Convert DER-encoded ECDSA signature to raw 64-byte format */
function derToRaw(der: Uint8Array): Uint8Array {
  // If already 64 bytes, it's raw format
  if (der.length === 64) return der;

  const raw = new Uint8Array(64);
  // DER: 0x30 [len] 0x02 [rLen] [r...] 0x02 [sLen] [s...]
  let offset = 2; // skip 0x30 and total length

  // Read r
  offset++; // skip 0x02
  let rLen = der[offset++];
  const rStart = rLen > 32 ? offset + (rLen - 32) : offset;
  const rDest = rLen > 32 ? 0 : 32 - rLen;
  raw.set(der.slice(rStart, offset + rLen), rDest);
  offset += rLen;

  // Read s
  offset++; // skip 0x02
  let sLen = der[offset++];
  const sStart = sLen > 32 ? offset + (sLen - 32) : offset;
  const sDest = sLen > 32 ? 32 : 64 - sLen;
  raw.set(der.slice(sStart, offset + sLen), sDest);

  return raw;
}

/** Send a single APNs notification */
async function sendAPNS(
  token: string,
  bundleId: string,
  apnsToken: string,
  deviceToken: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  priority?: string,
  environment?: string,
): Promise<{ success: boolean; error?: string }> {
  const host = environment === 'production'
    ? 'https://api.push.apple.com'
    : 'https://api.sandbox.push.apple.com';

  const payload = {
    aps: {
      alert: { title, body },
      sound: 'default',
      badge: 1,
      'content-available': 1,
      'mutable-content': 1,
    },
    ...(data || {}),
  };

  const resp = await fetch(`${host}/3/device/${deviceToken}`, {
    method: 'POST',
    headers: {
      'authorization': `bearer ${apnsToken}`,
      'apns-topic': bundleId,
      'apns-priority': priority === 'high' || priority === 'critical' ? '10' : '5',
      'apns-push-type': 'alert',
      'apns-expiration': '0',
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    console.error(`[APNS] Send failed (${resp.status}):`, errText);
    return { success: false, error: errText };
  }

  return { success: true };
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
      title,
      message,
      body: bodyAlias,
      data,
      action_url,
      priority,
      notification_type,
    } = await req.json();

    const notifBody = message || bodyAlias || '';
    const notifTitle = title || 'Notification';

    // ------------------------------------------------------------------
    // 1. Load APNs credentials from SystemSettings
    // ------------------------------------------------------------------
    const { data: apnsRow } = await supabaseAdmin
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'apns_credentials')
      .maybeSingle();

    if (!apnsRow?.setting_value) {
      console.warn('[APNS] No apns_credentials in SystemSettings');
      return Response.json({
        success: false,
        error: 'APNs credentials not configured. Admin must add them in Settings.',
      }, { status: 400 });
    }

    let creds: { key_id: string; team_id: string; private_key: string; bundle_id: string; environment?: string };
    try {
      creds = typeof apnsRow.setting_value === 'string'
        ? JSON.parse(apnsRow.setting_value)
        : apnsRow.setting_value;
    } catch {
      return Response.json({ success: false, error: 'Invalid APNs credentials JSON' }, { status: 400 });
    }

    if (!creds.key_id || !creds.team_id || !creds.private_key) {
      return Response.json({
        success: false,
        error: 'APNs credentials missing required fields (key_id, team_id, private_key)',
      }, { status: 400 });
    }

    const bundleId = creds.bundle_id || 'com.carecallai.app';
    const environment = creds.environment || 'production';

    // ------------------------------------------------------------------
    // 2. Generate APNs JWT token
    // ------------------------------------------------------------------
    const privateKey = await importAPNSKey(creds.private_key);
    const apnsJwt = await createAPNSToken(creds.key_id, creds.team_id, privateKey);

    // ------------------------------------------------------------------
    // 3. Resolve APNS device tokens for recipients
    // ------------------------------------------------------------------
    const userIds = recipient_ids || (recipient_id ? [recipient_id] : []);

    interface TokenEntry { userId: string; token: string }
    const tokensToSend: TokenEntry[] = [];

    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, apns_device_token')
        .in('id', userIds);

      if (profiles) {
        for (const p of profiles) {
          if (p.apns_device_token) {
            tokensToSend.push({ userId: p.id, token: p.apns_device_token });
          }
        }
      }

      // Also check users table as fallback
      if (tokensToSend.length === 0) {
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, apns_device_token')
          .in('id', userIds);
        if (users) {
          for (const u of users) {
            if (u.apns_device_token) {
              tokensToSend.push({ userId: u.id, token: u.apns_device_token });
            }
          }
        }
      }
    }

    if (tokensToSend.length === 0) {
      return Response.json({
        success: true,
        message: 'No APNS tokens found for recipients — nothing to send',
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
        sendAPNS(
          token,
          bundleId,
          apnsJwt,
          token,
          notifTitle,
          notifBody,
          dataPayload,
          priority,
          environment,
        )
      ),
    );

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    results.forEach((r, i) => {
      if (r.status === 'fulfilled' && r.value.success) {
        sent++;
        console.log(`[APNS] Sent to ${tokensToSend[i].userId}`);
      } else {
        failed++;
        const err = r.status === 'fulfilled' ? r.value.error : (r as PromiseRejectedResult).reason?.message;
        errors.push(`${tokensToSend[i].userId}: ${err}`);
        console.error(`[APNS] Failed for ${tokensToSend[i].userId}:`, err);
      }
    });

    return Response.json({
      success: sent > 0,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('sendAPNSPushNotification error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});
