// ─── Email Rewriter ───────────────────────────────────────────────────────────
// Rule-based rewriter. No AI API calls — pure string replacement + trimming.
// Called when scoreEmail < 85 or scorePersonalisation < 60.

import { scoreEmail, scorePersonalisation } from './email-evaluator.js'

const HUMAN_ALTERNATIVES = {
  "would love to":           ["can", "glad to", "happy to"],
  "i'd love to":             ["i can", "glad to"],
  "i would love to":         ["i can", "glad to"],
  "worth a quick call":      ["got 20 minutes?", "would a call make sense?", "want to see it?"],
  "worth a 20-minute call":  ["got 20 minutes?", "would a call make sense?"],
  "worth a 20 minute call":  ["got 20 minutes?", "would a call make sense?"],
  "i came across your":      ["i had a look at", "i found"],
  "i came across":           ["i had a look at", "i found", "i was looking at"],
  "i recently came across":  ["i had a look at"],
  "i stumbled upon":         ["i found", "i had a look at"],
  "i wanted to reach out":   ["writing because", "reaching out because"],
  "just wanted to touch base": ["following up", "circling back"],
  "no pitch":                [""],
  "no obligation":           [""],
  "no commitment":           [""],
  "happy to chat":           ["happy to show you", "can walk you through it"],
  "here's the thing":        [""],
  "here's what i mean":      [""],
  "here's the truth":        [""],
  "i'll keep this short":    [""],
  "i'll be brief":           [""],
  "let me be direct":        [""],
  "at the end of the day":   ["ultimately", ""],
  "the bottom line is":      ["simply put,", ""],
  "long story short":        ["in short,", ""],
  "to be honest":            [""],
  "looking forward to hearing": ["hope to hear from you", ""],
  "please let me know":      ["let me know", ""],
  "don't hesitate to":       [""],
  "feel free to":            [""],
  "would you be open to":    ["would", "is"],
  "are you available for":   ["got time for", ""],
  "do you have 20 minutes":  ["got 20 minutes?"],
  "pain points":             ["the stuff that eats time", "what's taking too long", "the work that piles up"],
  "streamline":              ["fix", "sort out", "speed up"],
  "leverage":                ["use", "get more from"],
  "synergy":                 ["collaboration", "working together"],
  "digital transformation":  ["modernising ops", "updating how you work"],
  "cutting-edge":            ["modern", "current"],
  "game-changer":            ["significant", "a real shift"],
  "revolutionize":           ["change", "transform"],
  "paradigm":                ["approach", "model"],
  "holistic":                ["complete", "full"],
  "robust solution":         ["solid fix", "reliable approach"],
  "best-in-class":           [""],
  "thought leader":          ["expert", ""],
  "move the needle":         ["make a difference", "have impact"],
  "deep dive":               ["look closely", "go through"],
  "circle back":             ["follow up", "come back to this"],
  "bandwidth":               ["time", "capacity"],
  "ops drag":                ["the admin that piles up", "the work that slows things down"],
  "operational drag":        ["the admin that piles up", "what's slowing things down"],
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function replaceAIPhrases(body) {
  let result = body
  // Sort by length descending to match longer phrases first
  const sorted = Object.entries(HUMAN_ALTERNATIVES).sort((a, b) => b[0].length - a[0].length)
  for (const [phrase, alternatives] of sorted) {
    const regex = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    if (regex.test(result)) {
      const replacement = pickRandom(alternatives)
      result = result.replace(regex, replacement)
    }
  }
  return result
}

function fixEmDashes(body) {
  // Replace em dash with comma or period depending on context
  return body
    .replace(/\s*—\s*/g, ', ')
    .replace(/,\s*,/g, ',') // clean up double commas
}

function trimToWordLimit(body, maxWords = 180) {
  const words = body.split(/\s+/)
  if (words.length <= maxWords) return body

  // Find paragraphs and remove the least specific sentence from the longest one
  const paras = body.split(/\n\n+/)
  // Sort by word count descending, trim the longest one's last sentence
  const sortedIdx = paras
    .map((p, i) => ({ i, len: p.split(/\s+/).length }))
    .sort((a, b) => b.len - a.len)

  if (sortedIdx.length > 0) {
    const idx = sortedIdx[0].i
    const sentences = paras[idx].split(/(?<=[.!?])\s+/)
    if (sentences.length > 1) {
      // Remove the last sentence of the longest paragraph
      paras[idx] = sentences.slice(0, -1).join(' ')
    }
  }

  return paras.join('\n\n')
}

function improveSubject(subject, leadData) {
  const { first = '', company = '' } = leadData || {}
  // If subject has number + hrs, replace with just company name or first name
  if (/\d+.{0,5}(hrs|hours)/i.test(subject)) {
    return company || first || subject
  }
  // If subject is very long, trim to first 6 words
  const words = subject.split(' ')
  if (words.length > 8) return words.slice(0, 6).join(' ')
  return subject
}

function fixSignoff(body) {
  return body.replace(/\n(Best,?|Kind regards,?|Warm regards,?|Regards,?)\s*\n/gi, '\n\nVarghese\n')
}

function applyRewrites(subject, body, problems, leadData) {
  let newSubject = subject
  let newBody = body

  const problemTypes = problems.map(p => p.type)

  if (problemTypes.includes('em_dash')) newBody = fixEmDashes(newBody)
  if (problemTypes.some(t => t === 'ai_phrase')) newBody = replaceAIPhrases(newBody)
  if (problemTypes.includes('formal_signoff')) newBody = fixSignoff(newBody)
  if (problemTypes.includes('too_long')) newBody = trimToWordLimit(newBody)
  if (problemTypes.includes('subject_spam') || problemTypes.includes('subject_long')) {
    newSubject = improveSubject(newSubject, leadData)
  }

  // Always clean up: collapse triple newlines, trim trailing spaces
  newBody = newBody.replace(/\n{3,}/g, '\n\n').replace(/[ \t]+$/gm, '').trim()

  return { subject: newSubject, body: newBody }
}

/**
 * Main rewrite loop. Up to 3 iterations — stops when both scores pass.
 * Returns { subject, body, aiScore, personalisationScore, iterations }
 */
export function refineEmail(subject, body, leadData, siteData, signals, maxIterations = 3) {
  let currentSubject = subject
  let currentBody = body
  // Track last score result so we don't re-score after a passing iteration
  let lastResult = null

  for (let i = 0; i < maxIterations; i++) {
    const scored = scoreEmail(currentSubject, currentBody)
    const personScore = scorePersonalisation(currentBody, leadData, siteData, signals)
    lastResult = { ...scored, personScore }

    if (scored.score >= 85 && personScore >= 60) break // passes — no more rewrites needed

    // Apply rewrites based on what's failing
    const rewritten = applyRewrites(currentSubject, currentBody, scored.problems, leadData)
    currentSubject = rewritten.subject
    currentBody = rewritten.body

    // On final iteration, score the rewritten result (we won't loop again)
    if (i === maxIterations - 1) {
      const finalScored = scoreEmail(currentSubject, currentBody)
      const finalPerson = scorePersonalisation(currentBody, leadData, siteData, signals)
      lastResult = { ...finalScored, personScore: finalPerson }
    }
  }

  return {
    subject: currentSubject,
    body: currentBody,
    aiScore: lastResult.score,
    personalisationScore: lastResult.personScore,
    grade: lastResult.grade,
    problems: lastResult.problems,
    wordCount: lastResult.wordCount,
  }
}
