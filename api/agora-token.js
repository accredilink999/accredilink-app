const { RtcTokenBuilder, RtcRole } = require('agora-token');

const APP_ID = process.env.AGORA_APP_ID || 'ff9f260da10245a5ab4855ea3ec59500';
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!APP_CERTIFICATE) {
    return res.status(500).json({ error: 'AGORA_APP_CERTIFICATE not configured in Vercel environment variables' });
  }

  const { channelName, uid } = req.body || {};
  if (!channelName || !uid) {
    return res.status(400).json({ error: 'channelName and uid are required' });
  }

  const expiry = Math.floor(Date.now() / 1000) + 3600; // 1 hour

  try {
    const token = RtcTokenBuilder.buildTokenWithUid(
      APP_ID,
      APP_CERTIFICATE,
      channelName,
      uid,
      RtcRole.PUBLISHER,
      expiry,
      expiry
    );
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Token generation failed: ' + err.message });
  }
};
