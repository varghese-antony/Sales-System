import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

export async function POST(req) {
  const { leadId, to, subject, body, leadName } = await req.json()

  if (!to || !subject || !body) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: true, // port 465 = SSL
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  try {
    await transporter.sendMail({
      from: `"Varghese Antony | Blendery" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text: body,
    })

    // Log to outreach table + mark lead as contacted
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
