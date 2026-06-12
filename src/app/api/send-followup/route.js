import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { ImapFlow } from 'imapflow'
import { createClient } from '@supabase/supabase-js'

// Follow-ups must look hand-typed — plain text style, no logo, no fancy HTML
function buildFollowupHtml(body) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 24px;background:#fff;font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#222;">
  <div style="max-width:580px;">
    ${body
      .split(/\n\n+/)
      .map(p => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')}
  </div>
</body></html>`
}

async function saveToSentFolder(rawMessage) {
  const client = new ImapFlow({
    host: 'imap.hostinger.com', port: 993, secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    logger: false,
  })
  try {
    await client.connect()
    await client.append('Sent', rawMessage, ['\\Seen'])
    await client.logout()
  } catch {}
}

// Banks of follow-up variations — pick one randomly per send
// so no two people get the exact same message. Same tone, slightly different words.
const FOLLOWUP_2_BANK = [
  (f) => `Hi ${f},\n\nJust bringing this back up in case it got lost.\n\nVarghese`,
  (f) => `Hi ${f},\n\nFlagging this again in case the timing is better now.\n\nVarghese`,
  (f) => `Hi ${f},\n\nDropping this back to the top, thought it was worth a second look.\n\nVarghese`,
  (f) => `Hi ${f},\n\nJust checking this didn't get buried.\n\nVarghese`,
  (f) => `Hi ${f},\n\nBringing this back up. Happy to answer any questions if you had a look.\n\nVarghese`,
]

const FOLLOWUP_3_BANK = [
  (f) => `Hi ${f},\n\nI'll leave it here. If the timing ever makes sense, you know where to find me.\n\nVarghese`,
  (f) => `Hi ${f},\n\nLast one from me. If it's ever relevant, I'm easy to find.\n\nVarghese`,
  (f) => `Hi ${f},\n\nStopping here. If things change, feel free to come back to this.\n\nVarghese`,
  (f) => `Hi ${f},\n\nI'll get out of your inbox after this. If it ever becomes relevant, you've got my details.\n\nVarghese`,
]

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

const FOLLOWUP_TEMPLATES = {
  2: (first) => pickRandom(FOLLOWUP_2_BANK)(first),
  3: (first) => pickRandom(FOLLOWUP_3_BANK)(first),
}

export async function POST(req) {
  const { sequenceId, leadId, to, firstName, originalSubject, originalMessageId } = await req.json()
  if (!sequenceId || !leadId || !to) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // Get current sequence state
  const { data: seq, error: seqErr } = await supabase
    .from('sequences').select('*').eq('id', sequenceId).single()

  if (seqErr || !seq) return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 })
  if (seq.complete || seq.replied) return NextResponse.json({ success: false, error: 'Sequence already complete' }, { status: 400 })

  const nextStep = seq.step + 1
  if (nextStep > 3) return NextResponse.json({ success: false, error: 'No more follow-ups in sequence' }, { status: 400 })

  const templateFn = FOLLOWUP_TEMPLATES[nextStep]
  if (!templateFn) return NextResponse.json({ success: false, error: 'Invalid step' }, { status: 400 })

  const first = firstName || 'there'
  const body = templateFn(first)
  const subject = `Re: ${originalSubject || seq.original_subject || 'following up'}`

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: 465, secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })

  try {
    const msgId = originalMessageId || seq.original_message_id
    const mailOptions = {
      from: `"Varghese Antony | Blendery" <${process.env.SMTP_USER}>`,
      to, subject, html: buildFollowupHtml(body),
      ...(msgId ? { headers: { 'In-Reply-To': msgId, 'References': msgId } } : {}),
    }

    await transporter.sendMail(mailOptions)

    // Save copy to Hostinger Sent folder
    const rawMsg = Buffer.from(
      `From: "Varghese Antony | Blendery" <${process.env.SMTP_USER}>\r\n` +
      `To: ${to}\r\nSubject: ${subject}\r\nDate: ${new Date().toUTCString()}\r\n` +
      `MIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n` +
      buildFollowupHtml(body)
    )
    await saveToSentFolder(rawMsg)

    // Update sequence
    const now = new Date()
    const isLastStep = nextStep === 3
    const nextDue = isLastStep ? null : (() => { const d = new Date(now); d.setUTCDate(d.getUTCDate() + 4); d.setUTCHours(5, 0, 0, 0); return d.toISOString() })()

    await supabase.from('sequences').update({
      step: nextStep,
      last_sent_at: now.toISOString(),
      next_due_at: nextDue,
      complete: isLastStep,
    }).eq('id', sequenceId)

    // Log to outreach table
    await supabase.from('outreach').insert({
      lead_id: leadId, type: 'email', subject, message: body, status: 'sent',
    })

    return NextResponse.json({ success: true, step: nextStep })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
