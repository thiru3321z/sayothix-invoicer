export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { to_email, to_name, from_name, invoice_number, invoice_date, due_date, billing_month, items_list, total_amount, bank_name, bank_acc, cc_email, bcc_email, pdf_base64, filename } = req.body;

  if (!to_email || !pdf_base64) return res.status(400).json({ error: 'Missing required fields' });

  const html = `
<div style="font-family:Arial,sans-serif;font-size:14px;line-height:1.6;max-width:600px;color:#222">
<p>Dear <b>${to_name || 'Sir/Madam'}</b>,</p>
<p>Please find below your invoice details from <b>${from_name || 'Sayothix PLT'}</b>:</p>
<hr style="border:1px solid #444">
<p>
📄 <b>INVOICE NO:</b> ${invoice_number}<br>
📅 <b>Invoice Date:</b> ${invoice_date}<br>
⏰ <b>Payment Due:</b> ${due_date}<br>
📆 <b>Billing Month:</b> ${billing_month}
</p>
<hr style="border:1px solid #444">
<p><b>CHARGES BREAKDOWN:</b><br>
${(items_list||'').replace(/\n/g,'<br>')}
</p>
<hr style="border:1px solid #444">
<p>💰 <b>TOTAL AMOUNT: ${total_amount}</b></p>
<hr style="border:1px solid #444">
<p>Please make payment to the following bank account:<br><br>
🏦 <b>Bank:</b> &nbsp;&nbsp;&nbsp;&nbsp;${bank_name}<br>
🔢 <b>Acc No:</b> &nbsp;${bank_acc}<br>
👤 <b>Name:</b> &nbsp;&nbsp;&nbsp;${from_name}
</p>
<p>Kindly transfer by the due date stated above and reply to this email with your payment receipt once done.</p>
<p>Should you have any questions regarding this invoice, please do not hesitate to contact us.</p>
<p>Thank you for your continued support and business. We truly appreciate it! 🙏</p>
<br>
<p>
Best regards,<br>
<b>Sayothix PLT</b><br>
Mr Tee<br>
Operations Manager<br>
+6018-7763232
</p>
<hr style="border:1px solid #444">
<p style="font-size:12px;color:#888">This is an auto-generated invoice email.<br>Please do not reply if payment has already been made.</p>
</div>`;

  const payload = {
    from: 'Sayothix PLT <hello@sayothix.com>',
    to: [to_email],
    subject: `Invoice ${invoice_number} from ${from_name || 'Sayothix PLT'}`,
    html,
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
