import { NextResponse } from 'next/server'

export async function POST(req) {
  const { lead } = await req.json()

  // Personalised email template based on Varghese's value proposition
  const subject = `Quick question about ${lead.company}'s operations, ${lead.first_name}`

  const body = `Hi ${lead.first_name},

I came across ${lead.company} and was impressed by what you're building.

I work with founder-led businesses (10–50 people) in ${lead.country || 'your region'} who are scaling fast but finding their operations can't keep up — teams doing manual work, no central visibility, founders stuck in the middle of every decision.

I recently helped a founder save $60,000 (he was about to hire an ops coordinator). Instead, we built him a system in 3 weeks — automated reporting, real-time task visibility, zero manual chasing.

${lead.industry ? `Given that you're in ${lead.industry}, I suspect you may be facing similar challenges.` : ''}

I'm curious — is operations or team coordination something you're actively trying to improve at ${lead.company}?

If yes, I'd love to have a 20-minute conversation. No pitch, just an honest look at what's going on and whether I can help.

You can book a call here: https://blendery.tech

Best,
Varghese Antony
Founder, Blendery Tech Solutions
blendery.tech`

  return NextResponse.json({ subject, body })
}
