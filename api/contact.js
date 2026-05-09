import { Resend } from 'resend';

// While on Resend's free sandbox sender (onboarding@resend.dev), TO_EMAIL must
// match the address you signed up with. Once you verify a custom domain, you
// can switch this back to alphazelectrical@gmail.com (or anywhere).
const TO_EMAIL = 'alphazelectrical@gmail.com';
const FROM_EMAIL = 'AlphaZ Website <onboarding@resend.dev>';

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;',
  }[c]));

const isValidEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || '').trim());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const {
    name = '',
    email = '',
    phone = '',
    type = '',
    city = '',
    message = '',
    urgent = false,
    _company = '',
  } = body;

  if (_company) {
    return res.status(200).json({ ok: true });
  }

  if (!String(name).trim() || !String(email).trim() || !String(message).trim()) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (String(message).length > 5000 || String(name).length > 200) {
    return res.status(400).json({ error: 'Submission too long' });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ error: 'Email service not configured' });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  const isUrgent = !!urgent && urgent !== 'false';
  const tag = isUrgent ? ' [URGENT]' : '';
  const subject = `New quote request${tag}: ${type || 'Project'} — ${name}`;

  const text = [
    `New quote request${tag}`,
    '',
    `Name:    ${name}`,
    `Email:   ${email}`,
    `Phone:   ${phone || '—'}`,
    `Type:    ${type || '—'}`,
    `City:    ${city || '—'}`,
    `Urgent:  ${isUrgent ? 'Yes' : 'No'}`,
    '',
    '--- Project details ---',
    message,
  ].join('\n');

  const html = `
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Inter,sans-serif;color:#0a1628;background:#f6f8fb;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e6ebf2;border-radius:14px;overflow:hidden;">
      <div style="background:#0a1628;padding:24px 28px;">
        <div style="color:#FFB81C;font-size:12px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;">AlphaZ Electrical &middot; Website</div>
        <h1 style="margin:6px 0 0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-.01em;">
          New quote request${tag ? `<span style="color:#FFB81C;"> ${escapeHtml(tag.trim())}</span>` : ''}
        </h1>
      </div>
      <div style="padding:24px 28px;">
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#5b6679;width:90px;">Name</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:8px 0;color:#5b6679;">Email</td><td style="padding:8px 0;font-weight:600;"><a href="mailto:${escapeHtml(email)}" style="color:#0a1628;text-decoration:underline;">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:8px 0;color:#5b6679;">Phone</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(phone || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#5b6679;">Type</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(type || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#5b6679;">City</td><td style="padding:8px 0;font-weight:600;">${escapeHtml(city || '—')}</td></tr>
          <tr><td style="padding:8px 0;color:#5b6679;">Urgent</td><td style="padding:8px 0;font-weight:600;color:${isUrgent ? '#b3261e' : '#0a1628'};">${isUrgent ? 'Yes' : 'No'}</td></tr>
        </table>
        <hr style="border:0;border-top:1px solid #e6ebf2;margin:18px 0;">
        <div style="color:#5b6679;font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;margin-bottom:8px;">Project details</div>
        <div style="font-size:14px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(message)}</div>
      </div>
      <div style="background:#f6f8fb;padding:14px 28px;color:#5b6679;font-size:12px;border-top:1px solid #e6ebf2;">
        Reply to this email to respond directly to ${escapeHtml(name)}.
      </div>
    </div>
  </div>`;

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      replyTo: email,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(502).json({
        error: error.message || 'Email service rejected the request',
        name: error.name,
      });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Send failure:', err);
    return res.status(500).json({
      error: (err && err.message) ? err.message : 'Failed to send',
    });
  }
}
