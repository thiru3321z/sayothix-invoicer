export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to_email, to_name, from_name, invoice_number, cc_email, bcc_email, pdf_base64, filename } = req.body;

  if (!to_email || !pdf_base64) return res.status(400).json({ error: 'Missing required fields' });

  const payload = {
    from: 'Sayothix PLT <hello@sayothix.com>',
    to: [to_email],
    subject: `Invoice ${invoice_number} from ${from_name || 'Sayothix PLT'}`,
    html: `<p>Dear ${to_name || 'Sir/Madam'},</p>
<p>Please find attached your invoice <strong>${invoice_number}</strong> from Sayothix PLT.</p>
<p>Kindly arrange payment upon receipt. Thank you for your continued support.</p>
<br>
<p>Regards,<br><strong>Sayothix PLT</strong><br>hello@sayothix.com</p>`,
    attachments: [{
      filename: filename || `Invoice-${invoice_number}.pdf`,
      content: pdf_base64,
    }],
  };

  if (cc_email) payload.cc = cc_email.split(',').map(e => e.trim()).filter(Boolean);
  if (bcc_email) payload.bcc = bcc_email.split(',').map(e => e.trim()).filter(Boolean);

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.message || 'Resend error' });
    return res.status(200).json({ success: true, id: data.id });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
