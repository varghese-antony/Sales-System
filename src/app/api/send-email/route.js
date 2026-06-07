import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'

async function saveToSentFolder(rawMessage) {
  const client = new ImapFlow({
    host: 'imap.hostinger.com',
    port: 993,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    logger: false,
  })
  try {
    await client.connect()
    // Hostinger Sent folder is usually called "Sent" or "INBOX.Sent"
    const sentFolder = 'Sent'
    await client.append(sentFolder, rawMessage, ['\\Seen'])
    await client.logout()
  } catch {
    // Don't fail the whole request if IMAP copy fails
  }
}

const SIGNATURE_HTML = `<table cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;padding-top:20px;border-top:2px solid #00F6FF;font-family:Arial,sans-serif;">
  <tr>
    <td style="padding-right:14px;vertical-align:middle;">
      <img src="https://sales-system-blendery.vercel.app/blendery-logo.png" alt="Blendery" width="40" height="40" style="display:block;" />
    </td>
    <td style="vertical-align:middle;">
      <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:2px;">Varghese Antony</div>
      <div style="font-size:12px;color:#666;margin-bottom:6px;">CEO &mdash; Blendery Tech Solutions</div>
      <div style="font-size:12px;color:#444;line-height:1.8;">
        +91 755 894 8849 &nbsp;|&nbsp; <a href="mailto:AntonyV@blendery.tech" style="color:#00a8b5;text-decoration:none;">AntonyV@blendery.tech</a><br/>
        26th Floor, Amber Gem Tower, UAE
      </div>
    </td>
  </tr>
</table>`

// Strip the plain-text sign-off the AI writes (Best, / Regards, / Warm regards, etc.)
function stripSignOff(text) {
  const cutoffs = [
    /\n+Best,?\s*\n/i,
    /\n+Warm regards,?\s*\n/i,
    /\n+Kind regards,?\s*\n/i,
    /\n+Regards,?\s*\n/i,
    /\n+Cheers,?\s*\n/i,
    /\n+Thanks,?\s*\n/i,
    /\n+Best wishes,?\s*\n/i,
  ]
  for (const pattern of cutoffs) {
    const idx = text.search(pattern)
    if (idx !== -1) return text.slice(0, idx).trimEnd()
  }
  return text.trimEnd()
}

function bodyToHtml(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
  return escaped
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#222;">${p.replace(/\n/g,'<br/>')}</p>`)
    .join('')
}

export async function POST(req) {
  const { leadId, to, subject, body } = await req.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  const cleanBody = stripSignOff(body)

  const htmlEmail = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 24px;background:#ffffff;font-family:Arial,sans-serif;">
  <div style="max-width:580px;">
    ${bodyToHtml(cleanBody)}
    <p style="margin:0 0 0;font-family:Arial,sans-serif;font-size:14px;color:#222;">Best,</p>
    ${SIGNATURE_HTML}
  </div>
</body>
</html>`

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // 465 = SSL as per Hostinger settings
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: `"Varghese Antony | Blendery" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlEmail,
    })

    // Build raw message and save to Hostinger Sent folder via IMAP
    const rawMsg = Buffer.from(
      `From: "Varghese Antony | Blendery" <${process.env.SMTP_USER}>\r\n` +
      `To: ${to}\r\n` +
      `Subject: ${subject}\r\n` +
      `Date: ${new Date().toUTCString()}\r\n` +
      `MIME-Version: 1.0\r\n` +
      `Content-Type: text/html; charset=utf-8\r\n\r\n` +
      htmlEmail
    )
    await saveToSentFolder(rawMsg)

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
