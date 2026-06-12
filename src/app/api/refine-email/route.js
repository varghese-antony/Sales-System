import { NextResponse } from 'next/server'
import { scoreEmail, scorePersonalisation } from '@/lib/email-evaluator'
import { refineEmail } from '@/lib/email-rewriter'

// Refine an already-generated email without re-scraping the website.
// Called from the Smart Outreach UI when the score badge shows warn/fail.
export async function POST(req) {
  const { subject, body, lead } = await req.json()
  if (!subject || !body || !lead) {
    return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
  }

  const leadData = {
    first: lead.first_name || lead.full_name?.split(' ')[0] || 'there',
    company: lead.company || '',
    industry: lead.industry || '',
    country: lead.country || '',
  }

  // Run the rewrite loop (up to 3 iterations, no web scraping)
  const refined = refineEmail(subject, body, leadData, [], [], 3)

  return NextResponse.json({
    success: true,
    subject: refined.subject,
    body: refined.body,
    aiScore: refined.aiScore,
    personalisationScore: refined.personalisationScore,
    grade: refined.grade,
    problems: refined.problems,
    wordCount: refined.wordCount,
  })
}
