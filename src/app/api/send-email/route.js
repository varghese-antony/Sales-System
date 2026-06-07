import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

const SIGNATURE_HTML = `
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #e8e8e8;font-family:Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding-right:16px;vertical-align:middle;">
        <img src="https://sales-system-blendery.vercel.app/blendery-logo.png" alt="Blendery" width="36" height="36" style="display:block;border-radius:6px;" />
      </td>
      <td style="vertical-align:middle;border-left:2px solid #00F6FF;padding-left:16px;">
        <div style="font-size:14px;font-weight:700;color:#111;line-height:1.3;">Varghese Antony</div>
        <div style="font-size:12px;color:#555;margin-top:1px;">CEO &mdash; Blendery Tech Solutions</div>
        <div style="margin-top:6px;font-size:12px;color:#555;line-height:1.7;">
          📱 +91 755 894 8849<br/>
          ✉ <a href="mailto:AntonyV@blendery.tech" style="color:#00a8b5;text-decoration:none;">AntonyV@blendery.tech</a><br/>
          📍 BC-889846, 26th Floor, Amber Gem Tower, UAE
        </div>
      </td>
    </tr>
  </table>
</div>
`

function bodyToHtml(text) {
  // Convert plain text paragraphs to HTML, preserve line breaks
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  const paragraphs = escaped.split(/\n\n+/)
  return paragraphs
    .map(p => `<p style="margin:0 0 14px;font-family:Arial,sans-serif;font-size:14px;line-height:1.7;color:#222;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('')
}

export async function POST(req) {
  const { leadId, to, subject, body, leadName } = await req.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const htmlBody = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#fff;">
  <div style="max-width:600px;">
    ${bodyToHtml(body)}
    ${SIGNATURE_HTML}
  </div>
</body>
</html>`

  try {
    await transporter.sendMail({
      from: `"Varghese Antony | Blendery" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,   // plain text fallback
      html: htmlBody, // rich HTML with signature
    })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    await supabase.from('outreach').insert({
      lead_id: leadId,
      type: 'email',
      subject,
      message: body,
      status: 'sent',
    })
    await supabase.from('leads').update({ status: 'contacted' }).eq('id', leadId)

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
