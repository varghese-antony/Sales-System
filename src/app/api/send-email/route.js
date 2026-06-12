import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'

// Logo embedded as base64 — always shows in email clients, no external URL needed
const LOGO_BASE64 = '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'

const SIGNATURE_HTML = `
<div style="margin-top:28px;padding-top:20px;border-top:2px solid #00c8d4;font-family:Arial,sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding-right:14px;vertical-align:middle;">
        <img src="data:image/png;base64,${LOGO_BASE64}" alt="Blendery" width="42" height="42" style="display:block;border-radius:6px;" />
      </td>
      <td style="vertical-align:middle;">
        <div style="font-size:15px;font-weight:700;color:#111;margin-bottom:2px;">Varghese Antony</div>
        <div style="font-size:12px;color:#666;margin-bottom:6px;">CEO &mdash; Blendery Tech Solutions</div>
        <div style="font-size:12px;color:#444;line-height:1.9;">
          +91 755 894 8849 &nbsp;|&nbsp; <a href="mailto:AntonyV@blendery.tech" style="color:#00a8b5;text-decoration:none;">AntonyV@blendery.tech</a><br/>
          26th Floor, Amber Gem Tower, UAE
        </div>
      </td>
    </tr>
  </table>
</div>`

async function saveToSentFolder(rawMessage) {
  const client = new ImapFlow({
    host: 'imap.hostinger.com',
    port: 993,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  })
  try {
    await client.connect()
    await client.append('Sent', rawMessage, ['\\Seen'])
    await client.logout()
  } catch {}
}

function stripSignOff(text) {
  const idx = text.search(/\n+(Best|Warm regards|Kind regards|Regards|Cheers|Thanks|Sincerely|Best wishes),?\s*\n/i)
  return idx !== -1 ? text.slice(0, idx).trimEnd() : text.trimEnd()
}

function bodyToHtml(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 16px;font-family:Arial,sans-serif;font-size:14px;line-height:1.75;color:#222;">${p.replace(/\n/g,'<br/>')}</p>`)
    .join('')
}

export async function POST(req) {
  const { leadId, to, subject, body, variation = 2 } = await req.json()
  if (!to || !subject || !body) return NextResponse.json({ success:false, error:'Missing fields' }, { status:400 })

  const cleanBody = stripSignOff(body)
  const trackingUrl = `https://sales-system-blendery.vercel.app/api/track-open/${leadId}`
  const htmlEmail = `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 24px;background:#fff;font-family:Arial,sans-serif;">
  <div style="max-width:580px;">
    ${bodyToHtml(cleanBody)}
    <p style="margin:0 0 0;font-family:Arial,sans-serif;font-size:14px;color:#222;">Best,</p>
    ${SIGNATURE_HTML}
  </div>
  <img src="${trackingUrl}" width="1" height="1" style="display:none;border:0;width:1px;height:1px;" alt="" />
</body></html>`

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  try {
    const info = await transporter.sendMail({
      from: `"Varghese Antony | Blendery" <${process.env.SMTP_USER}>`,
      to, subject, html: htmlEmail,
    })
    const messageId = info.messageId || null

    const rawMsg = Buffer.from(
      `From: "Varghese Antony | Blendery" <${process.env.SMTP_USER}>\r\n` +
      `To: ${to}\r\nSubject: ${subject}\r\nDate: ${new Date().toUTCString()}\r\n` +
      `MIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n` + htmlEmail
    )
    await saveToSentFolder(rawMsg)

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

    const { error: outreachErr } = await supabase.from('outreach').insert({ lead_id:leadId, type:'email', subject, message:body, status:'sent' })
    if (outreachErr) await logError('send-email', 'outreach-insert-failed', outreachErr, { leadId })

    const { error: leadErr } = await supabase.from('leads').update({ status:'contacted' }).eq('id', leadId)
    if (leadErr) await logError('send-email', 'lead-status-update-failed', leadErr, { leadId })

    // Create or reset the outreach sequence for this lead
    const now = new Date()
    // Normalise to 05:00 UTC 3 days from now so the 06:00 UTC cron reliably catches it
    const nextDue = (() => {
      const d = new Date(now)
      d.setUTCDate(d.getUTCDate() + 3)
      d.setUTCHours(5, 0, 0, 0)
      return d.toISOString()
    })()
    // Remove any existing incomplete sequence first
    const { error: delErr } = await supabase.from('sequences').delete()
      .eq('lead_id', leadId).eq('complete', false).eq('replied', false)
    if (delErr) await logError('send-email', 'sequence-delete-failed', delErr, { leadId })

    // Create fresh sequence starting at step 1
    const { error: seqErr } = await supabase.from('sequences').insert({
      lead_id: leadId,
      angle_number: variation,
      step: 1,
      last_sent_at: now.toISOString(),
      next_due_at: nextDue,
      original_subject: subject,
      original_message_id: messageId,
      replied: false,
      complete: false,
    })
    if (seqErr) await logError('send-email', 'sequence-insert-failed', seqErr, { leadId })

    return NextResponse.json({ success:true })
  } catch (err) {
    return NextResponse.json({ success:false, error:err.message }, { status:500 })
  }
}
