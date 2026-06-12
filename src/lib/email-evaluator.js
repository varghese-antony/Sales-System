// ─── Email Evaluator ─────────────────────────────────────────────────────────
// Scores every generated email before showing it to Varghese.
// Two scores: AI-tell detection (0–100) and personalisation (0–100).
// No external API calls — pure pattern matching.

const AI_PHRASES = [
  // Hollow openers
  "i hope this finds you",
  "i wanted to reach out",
  "just wanted to touch base",
  "i came across your",
  "i recently came across",
  "i stumbled upon",
  // Salesy reassurances
  "no pitch",
  "no obligation",
  "no commitment",
  "happy to chat",
  "would love to",
  "i'd love to",
  "i would love to",
  "feel free to",
  // AI-favourite transitions
  "here's the thing",
  "here's what i mean",
  "here's the truth",
  "at the end of the day",
  "the bottom line is",
  "long story short",
  "to be honest",
  "i'll be brief",
  "i'll keep this short",
  "let me be direct",
  // Overly polished closers
  "worth a quick call",
  "worth a 20-minute call",
  "worth a 20 minute call",
  "would you be open to",
  "are you available for",
  "do you have 20 minutes",
  "looking forward to hearing",
  "please let me know",
  "don't hesitate to",
  // Buzzwords
  "streamline",
  "leverage",
  "synergy",
  "digital transformation",
  "cutting-edge",
  "game-changer",
  "revolutionize",
  "paradigm",
  "holistic",
  "robust solution",
  "best-in-class",
  "thought leader",
  "move the needle",
  "deep dive",
  "circle back",
  "bandwidth",
  "pain points",
  "ops drag",
  "operational drag",
]

/**
 * Score how "human" an email sounds. Returns 0–100 and a list of problems.
 * 85+  → Pass (show as-is)
 * 65–84 → Warning (show with problems highlighted)
 * <65  → Fail (auto-rewrite)
 */
export function scoreEmail(subject, body) {
  let score = 100
  const problems = []
  const bodyLower = (body || '').toLowerCase()
  const subjectLower = (subject || '').toLowerCase()

  // Check AI phrases
  for (const phrase of AI_PHRASES) {
    if (bodyLower.includes(phrase)) {
      score -= 8
      problems.push({ type: 'ai_phrase', text: phrase, severity: 'medium' })
    }
  }

  // Em dash in body = -20
  if (body.includes('—')) {
    score -= 20
    problems.push({ type: 'em_dash', text: 'Em dash (—) found — use comma or period instead', severity: 'high' })
  }

  // More than 2 "I" in one sentence = -10
  const sentences = body.split(/[.!?]+/).filter(Boolean)
  for (const s of sentences) {
    const iCount = (s.match(/\bI\b/g) || []).length
    if (iCount > 2) {
      score -= 10
      problems.push({ type: 'i_overuse', text: `Too many "I" in one sentence: "${s.trim().slice(0, 60)}..."`, severity: 'medium' })
      break
    }
  }

  // All paragraphs same length = -15 (too structured)
  const paras = body.split(/\n\n+/).filter(p => p.trim().length > 0)
  if (paras.length >= 3) {
    const lengths = paras.map(p => p.split(' ').length)
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
    const allSimilar = lengths.every(l => Math.abs(l - avg) < 4)
    if (allSimilar) {
      score -= 15
      problems.push({ type: 'uniform_structure', text: 'All paragraphs are the same length — feels templated', severity: 'medium' })
    }
  }

  // Subject contains number + hrs/hours = -20 (spam trigger)
  if (/\d+.{0,5}(hrs|hours)/i.test(subjectLower)) {
    score -= 20
    problems.push({ type: 'subject_spam', text: 'Subject has number + hours — spam filter risk', severity: 'high' })
  }

  // Subject longer than 8 words = -10
  if (subject.split(' ').length > 8) {
    score -= 10
    problems.push({ type: 'subject_long', text: `Subject is ${subject.split(' ').length} words — keep under 8`, severity: 'low' })
  }

  // Body over 180 words = -10
  const wordCount = body.split(/\s+/).filter(Boolean).length
  if (wordCount > 180) {
    score -= 10
    problems.push({ type: 'too_long', text: `Email is ${wordCount} words — aim for under 180`, severity: 'low' })
  }

  // Ends with formal sign-off = -15
  if (/\n(best,?|kind regards,?|warm regards,?|regards,?)\s*\n/i.test(body)) {
    score -= 15
    problems.push({ type: 'formal_signoff', text: 'Formal sign-off detected — end with just "Varghese"', severity: 'high' })
  }

  return {
    score: Math.max(0, score),
    problems,
    grade: score >= 85 ? 'pass' : score >= 65 ? 'warn' : 'fail',
    wordCount,
  }
}

/**
 * Score how personalised an email is to the specific lead.
 * Returns 0–100. Minimum 60 to pass.
 */
export function scorePersonalisation(body, leadData, siteData, signals) {
  let score = 50 // start at 50 — neither good nor bad
  const bodyLower = (body || '').toLowerCase()
  const { company = '', industry = '', country = '' } = leadData || {}

  // +20 if body contains a phrase from their actual website copy
  const allSiteCopy = (siteData || []).flatMap(p => [
    ...(p.paras || []),
    ...(p.h1 || []),
    ...(p.h2 || []),
    p.meta || '',
  ]).filter(Boolean).join(' ').toLowerCase()

  const siteWords = allSiteCopy.split(/\s+/).filter(w => w.length > 5)
  const mirrorCount = siteWords.filter(w => bodyLower.includes(w)).length
  if (mirrorCount > 10) score += 20

  // +20 if body references their specific service (from H2s)
  const services = (siteData || []).flatMap(p => p.h2 || []).filter(Boolean)
  if (services.some(s => bodyLower.includes(s.toLowerCase().slice(0, 15)))) score += 20

  // +15 if body references a Google signal
  if ((signals || []).some(sig => {
    const words = sig.toLowerCase().split(/\s+/).filter(w => w.length > 5)
    return words.some(w => bodyLower.includes(w))
  })) score += 15

  // +15 if body uses their tagline or H1
  const taglines = (siteData || []).flatMap(p => p.h1 || []).filter(Boolean)
  if (taglines.some(t => bodyLower.includes(t.toLowerCase().slice(0, 20)))) score += 15

  // +10 if company name appears more than once
  const companyMentions = (bodyLower.match(new RegExp(company.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length
  if (companyMentions > 1) score += 10

  // +10 if country or city appears
  if (country && bodyLower.includes(country.toLowerCase())) score += 10

  // -20 if too generic (no company-specific words at all)
  if (mirrorCount === 0 && companyMentions <= 1) score -= 20

  // -30 if company name only in greeting
  const bodyWithoutGreeting = body.replace(/^Hi\s+\w+,?\s*/i, '')
  const mentionsAfterGreeting = (bodyWithoutGreeting.toLowerCase().match(
    new RegExp(company.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')
  ) || []).length
  if (companyMentions >= 1 && mentionsAfterGreeting === 0) score -= 30

  return Math.max(0, Math.min(100, score))
}
