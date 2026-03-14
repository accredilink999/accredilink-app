import { NextResponse } from 'next/server';
import { getCallerFromToken } from '@/app/lib/auth';

// POST — update homecare API key (stores note in response, actual env var must be set in Vercel)
export async function POST(request) {
  const caller = getCallerFromToken(request);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { action, key } = body;

  if (action === 'update_key') {
    if (!key) return NextResponse.json({ error: 'API key is required' }, { status: 400 });

    // Try to update the Vercel env var via their API
    const vercelToken = process.env.VERCEL_TOKEN;
    const projectId = process.env.VERCEL_PROJECT_ID;

    if (vercelToken && projectId) {
      try {
        // Check if env var exists
        const listRes = await fetch(`https://api.vercel.com/v9/projects/${projectId}/env`, {
          headers: { Authorization: `Bearer ${vercelToken}` },
        });
        const envVars = await listRes.json();
        const existing = (envVars.envs || []).find(e => e.key === 'HOMECARE_API_KEY');

        if (existing) {
          // Update existing
          await fetch(`https://api.vercel.com/v9/projects/${projectId}/env/${existing.id}`, {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ value: key }),
          });
        } else {
          // Create new
          await fetch(`https://api.vercel.com/v10/projects/${projectId}/env`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${vercelToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              key: 'HOMECARE_API_KEY',
              value: key,
              type: 'encrypted',
              target: ['production', 'preview'],
            }),
          });
        }

        return NextResponse.json({
          success: true,
          message: 'API key updated in Vercel. A redeployment is needed for changes to take effect.',
        });
      } catch (err) {
        console.error('Vercel API error:', err);
        return NextResponse.json({
          success: true,
          message: 'Key noted. Please set HOMECARE_API_KEY manually in Vercel Environment Variables and redeploy.',
          manual: true,
        });
      }
    }

    // No Vercel token — manual update needed
    return NextResponse.json({
      success: true,
      message: 'Please set HOMECARE_API_KEY in your Vercel project Environment Variables and redeploy.',
      manual: true,
    });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

// GET — check if API key is configured
export async function GET(request) {
  const caller = getCallerFromToken(request);
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const hasKey = !!process.env.HOMECARE_API_KEY;
  return NextResponse.json({
    configured: hasKey,
    keyPrefix: hasKey ? process.env.HOMECARE_API_KEY.slice(0, 4) + '****' : null,
  });
}
