import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'
import { logError } from '@/lib/log-error'
import { saveToSentFolder } from '@/lib/imap'
import { getNextDueAt } from '@/lib/send-window'

// Follow-ups must look hand-typed — plain text style, no logo, no fancy HTML
function buildFollowupHtml(body, leadId) {
  const unsubscribeUrl = `https://sales-system-blendery.vercel.app/api/unsubscribe/${leadId}`
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:32px 24px;background:#fff;font-family:Arial,sans-serif;font-size:14px;line-height:1.8;color:#222;">
  <div style="max-width:580px;">
    ${body
      .split(/\n\n+/)
      .map(p => `<p style="margin:0 0 16px;">${p.replace(/\n/g, '<br/>')}</p>`)
      .join('')}
    <p style="margin:24px 0 0;font-family:Arial,sans-serif;font-size:11px;color:#aaa;line-height:1.6;">
      Blendery Tech Solutions &middot; 26th Floor, Amber Gem Tower, UAE<br/>
      <a href="${unsubscribeUrl}" style="color:#aaa;text-decoration:underline;">Unsubscribe</a> from future emails.
    </p>
  </div>
</body></html>`
}

// Banks of follow-up variations — pick one randomly per send
// so no two people get the exact same message. Same tone, slightly different words.
//
// Step 2 strategy: don't just "bump" — acknowledge they're busy and lower the friction.
// Offer email as an alternative to a call, or ask if they can redirect us.
// This gives them an easy way to respond without committing to a call.
const FOLLOWUP_2_BANK = [
  (f) => `Hi ${f},\n\nJust checking this didn't get lost. If a call doesn't suit right now, happy to keep it to a quick email exchange instead — whatever's easier.\n\nVarghese`,
  (f) => `Hi ${f},\n\nFlagging this in case the timing's changed. And if you're not the right person for this, would you mind pointing me in the right direction?\n\nVarghese`,
  (f) => `Hi ${f},\n\nBringing this back up. No pressure — even a quick 'not for us right now' is useful. Happy either way.\n\nVarghese`,
  (f) => `Hi ${f},\n\nDropping this back to the top. If a call doesn't work for you, I'm just as happy to start with a couple of questions over email to see if it's even worth your time.\n\nVarghese`,
  (f) => `Hi ${f},\n\nJust in case this got buried. If things have moved on or the timing's off, no problem at all — just let me know and I'll leave it there.\n\nVarghese`,
]

// Step 3 strategy: close the loop gracefully. Short, warm, no guilt-tripping.
// Leave the door open without being pushy. This is the last email — make it memorable.
const FOLLOWUP_3_BANK = [
  (f) => `Hi ${f},\n\nI'll leave it there — if things change or the timing ever makes sense, you know where to find me.\n\nVarghese`,
  (f) => `Hi ${f},\n\nLast one from me. If it ever becomes relevant, I'm easy to reach.\n\nVarghese`,
  (f) => `Hi ${f},\n\nStopping here. If anything changes on your end, feel free to come back to this.\n\nVarghese`,
  (f) => `Hi ${f},\n\nI'll step out of your inbox after this. If it ever makes sense down the line, my details are below.\n\nVarghese`,
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
    .from('sequences').select('*, leads(country)').eq('id', sequenceId).single()

  if (seqErr || !seq) return NextResponse.json({ success: false, error: 'Sequence not found' }, { status: 404 })
  if (seq.complete || seq.replied) return NextResponse.json({ success: false, error: 'Sequence already complete' }, { status: 400 })

  const nextStep = seq.step + 1
  if (nextStep > 3) return NextResponse.json({ success: false, error: 'No more follow-ups in sequence' }, { status: 400 })

  // ── Idempotency guard ──────────────────────────────────────────────────────
  // If the sequence was already updated to this step within the last 6 hours,
  // it means the email was sent but the step-update succeeded. Do not resend.
  // This also covers: SMTP sent OK → sequence update failed → cron retries next day.
  // We check the outreach table for a recent send for this lead to catch that case.
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
  if (seq.last_sent_at && seq.last_sent_at >= sixHoursAgo) {
    return NextResponse.json({ success: false, error: `Step ${seq.step} was already sent within the last 6 hours` }, { status: 409 })
  }
  // Also check outreach table in case step update failed but outreach row was written
  const { data: recentOutreach } = await supabase
    .from('outreach')
    .select('id')
    .eq('lead_id', leadId)
    .gte('created_at', sixHoursAgo)
    .limit(1)
  if (recentOutreach && recentOutreach.length > 0) {
    return NextResponse.json({ success: false, error: 'A follow-up to this lead was already sent within the last 6 hours' }, { status: 409 })
  }

  const templateFn = FOLLOWUP_TEMPLATES[nextStep]
  if (!templateFn) return NextResponse.json({ success: false, error: 'Invalid step' }, { status: 400 })

  // ── First-name quality gate ──────────────────────────────────────────────────
  // Mirror the same gate as auto-send.
  // Real name → use it. Generic inbox → "{Company} team". Otherwise → block.
  const BAD_FIRST_NAMES = new Set([
    '','there','the','a','an','and','or','of','in','at','for','with',
    'ltd','llc','inc','co','corp','pty','group','agency','digital','media',
    'solutions','tech','technologies','consulting','services','global',
    'international','studio','studios','design','creative','marketing',
    'management','new','old','one','two','three','four','five','six',
    'seven','eight','nine','ten','first','second','third',
  ])
  const GENERIC_PREFIXES = new Set([
    'info','hello','contact','enquiries','enquire','sales','support','admin',
    'mail','office','team','hi','hey','help','welcome','reception','ops',
    'operations','hr','jobs','careers','media','press','pr','legal',
    'finance','billing','accounts','general','newbusiness','clientimpact',
    'collective','hoot','speaktosleek','talktous','dispatch','faculty',
    'future','events','secretariat','charities','lainfo','moscowoffice',
    'vietnam','london','melbourne','salesteam','email','newbusiness',
    'techsupport','tech','service','services','enquiry','inquiry',
    'clientservices','customerservice','customersupport','noreply',
  ])
  const rawFirst = (firstName || '').trim()
  const emailPrefix = (to || '').split('@')[0].toLowerCase().replace(/[^a-z]/g, '')
  const firstIsBad = !rawFirst || BAD_FIRST_NAMES.has(rawFirst.toLowerCase()) || rawFirst.split(' ').length > 2

  let first
  if (!firstIsBad) {
    first = rawFirst
  } else if (GENERIC_PREFIXES.has(emailPrefix)) {
    // Fetch company name from lead record for the fallback greeting
    const { data: leadRow } = await supabase.from('leads').select('company').eq('id', leadId).single()
    const co_short = (leadRow?.company || 'your company').replace(/\s*(ltd|llc|inc|pty|co|corp|group|digital|media|agency|solutions|tech|technologies|consulting|services|global|international|studio|studios|design|creative|marketing|management|plc|limited|pty ltd)\.?$/i, '').trim()
    first = `${co_short} team`
  } else {
    return NextResponse.json({
      success: false,
      error: `Blocked: bad first_name "${rawFirst || 'empty'}" for lead ${leadId} — fix first_name in leads table before follow-up can send`,
    }, { status: 422 })
  }
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
      to, subject, html: buildFollowupHtml(body, leadId),
      ...(msgId ? { headers: { 'In-Reply-To': msgId, 'References': msgId } } : {}),
    }

    await transporter.sendMail(mailOptions)

    // Save copy to Hostinger Sent folder
    const rawMsg = Buffer.from(
      `From: "Varghese Antony | Blendery" <${process.env.SMTP_USER}>\r\n` +
      `To: ${to}\r\nSubject: ${subject}\r\nDate: ${new Date().toUTCString()}\r\n` +
      `MIME-Version: 1.0\r\nContent-Type: text/html; charset=utf-8\r\n\r\n` +
      buildFollowupHtml(body, leadId)
    )
    await saveToSentFolder(rawMsg)

    // Update sequence
    const now = new Date()
    const isLastStep = nextStep === 3
    // Timezone-aware: 12:00 UTC 4 days from now → caught by 13:00 UTC cron
    const nextDue = isLastStep ? null : getNextDueAt(seq.leads?.country, 4)

    const { error: seqUpdateErr } = await supabase.from('sequences').update({
      step: nextStep,
      last_sent_at: now.toISOString(),
      next_due_at: nextDue,
      complete: isLastStep,
    }).eq('id', sequenceId)
    // This is the most critical write — if it fails the cron will resend the same follow-up
    if (seqUpdateErr) await logError('send-followup', 'sequence-step-update-failed', seqUpdateErr, { sequenceId, leadId, nextStep })

    const { error: outreachErr } = await supabase.from('outreach').insert({
      lead_id: leadId, type: 'email', subject, message: body, status: 'sent',
    })
    if (outreachErr) await logError('send-followup', 'outreach-insert-failed', outreachErr, { sequenceId, leadId })

    return NextResponse.json({ success: true, step: nextStep })
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
