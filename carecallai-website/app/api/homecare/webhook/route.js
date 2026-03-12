import { NextResponse } from 'next/server';

const ALERT_EMAIL = 'hello@carecallai.co.uk';
const FROM_EMAIL = 'hello@carecallai.co.uk';

async function sendAlertEmail({ subject, html }) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase not configured for email');
    return;
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/send-campaign-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey,
    },
    body: JSON.stringify({
      to: ALERT_EMAIL,
      from: FROM_EMAIL,
      subject,
      html,
      replyTo: FROM_EMAIL,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('Alert email failed:', err);
  }
}

// POST — webhook from homecare.co.uk for new enquiries/actions
export async function POST(request) {
  try {
    const body = await request.json();

    // Build email content based on what data arrives
    const enquiryName = `${body.firstName || ''} ${body.surname || ''}`.trim() || 'Anonymous';
    const category = body.category?.name || body.type || 'General Enquiry';
    const phone = body.telephone || 'Not provided';
    const email = body.from || body.email || body.to || 'Not provided';
    const content = body.content || body.message || '';
    const location = [body.town, body.postcode].filter(Boolean).join(', ') || 'Not specified';
    const date = body.date || new Date().toISOString().split('T')[0];

    const subject = `New Homecare.co.uk Enquiry: ${category} from ${enquiryName}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">New Enquiry from Homecare.co.uk</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 14px;">${date}</p>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; font-size: 13px; width: 120px;">Category</td>
              <td style="padding: 8px 12px; color: #1e293b; font-size: 14px;">
                <span style="background: #dbeafe; color: #1e40af; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: 600;">${category}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; font-size: 13px;">Name</td>
              <td style="padding: 8px 12px; color: #1e293b; font-size: 14px; font-weight: 600;">${enquiryName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; font-size: 13px;">Phone</td>
              <td style="padding: 8px 12px; color: #1e293b; font-size: 14px;">
                ${phone !== 'Not provided' ? `<a href="tel:${phone}" style="color: #0d9488; text-decoration: none;">${phone}</a>` : phone}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; font-size: 13px;">Email</td>
              <td style="padding: 8px 12px; color: #1e293b; font-size: 14px;">
                ${email !== 'Not provided' ? `<a href="mailto:${email}" style="color: #0d9488; text-decoration: none;">${email}</a>` : email}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #64748b; font-size: 13px;">Location</td>
              <td style="padding: 8px 12px; color: #1e293b; font-size: 14px;">${location}</td>
            </tr>
          </table>
          ${content ? `
            <div style="margin-top: 16px; padding: 16px; background: white; border: 1px solid #e2e8f0; border-radius: 8px;">
              <p style="margin: 0 0 4px; font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase;">Message</p>
              <p style="margin: 0; color: #334155; font-size: 14px; line-height: 1.6;">${content}</p>
            </div>
          ` : ''}
          <div style="margin-top: 20px; text-align: center;">
            <a href="https://carecallai.co.uk/admin/homecare" style="display: inline-block; background: #ea580c; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600;">
              View in Admin Panel
            </a>
          </div>
          <p style="margin-top: 16px; text-align: center; color: #94a3b8; font-size: 11px;">
            This alert was sent by CareCallAI &middot; homecare.co.uk integration
          </p>
        </div>
      </div>
    `;

    await sendAlertEmail({ subject, html });

    return NextResponse.json({ success: true, message: 'Alert sent' });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json({ success: true }); // Always return 200 to avoid webhook retries
  }
}

// GET — health check for webhook
export async function GET() {
  return NextResponse.json({ status: 'ok', webhook: 'homecare.co.uk alerts active' });
}
