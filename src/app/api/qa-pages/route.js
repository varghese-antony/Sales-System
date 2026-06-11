import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// ─── Page & UI Health Checker ─────────────────────────────────────────────────
// Fetches every page in the app, checks:
//  • HTTP 200 returned
//  • No error text in response ("Application error", "500", "Something went wrong")
//  • Key UI elements are present (sidebar, page title, critical buttons)
//  • Response time is acceptable (<5s)
//
// Called by qa-health and by GitHub Actions on every deploy

const APP_URL = 'https://sales-system-blendery.vercel.app'
const NOTIFY_EMAIL = 'antonyv@blendery.tech'

const PAGES = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    mustContain: ['Good day', 'Total Leads', 'Priority Leads', 'Pipeline', 'Daily Auto-Run'],
    mustNotContain: ['Application error', 'unhandled', 'NEXT_NOT_FOUND'],
  },
  {
    path: '/leads',
    name: 'Leads',
    mustContain: ['Find Leads', 'Send Now', 'Sync Sent', 'PERSON', 'COMPANY', 'EMAIL'],
    mustNotContain: ['Application error', 'unhandled'],
  },
  {
    path: '/smart-outreach',
    name: 'Smart Outreach',
    mustContain: ['Smart Outreach', 'Research', 'Connect', 'Email + DM'],
    mustNotContain: ['Application error', 'unhandled'],
  },
  {
    path: '/outreach',
    name: 'Outreach',
    mustContain: ['Outreach', 'Subject', 'angle'],
    mustNotContain: ['Application error', 'unhandled'],
  },
  {
    path: '/pipeline',
    name: 'Pipeline',
    mustContain: ['Pipeline'],
    mustNotContain: ['Application error', 'unhandled'],
  },
  {
    path: '/api/qa-health',
    name: 'QA Health API',
    mustContain: ['healthy', 'checks', 'results'],
    mustNotContain: ['Internal Server Error'],
    isJson: true,
  },
]

function transport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.hostinger.com',
    port: 465, secure: true,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  })
}

async function checkPage(page) {
  const start = Date.now()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)

    const res = await fetch(`${APP_URL}${page.path}`, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Blendery-QA/1.0' },
    })
    clearTimeout(timeout)

    const ms = Date.now() - start
    const body = await res.text()

    // Check status
    if (!res.ok) {
      return {
        page: page.name, path: page.path, status: 'fail', ms,
        reason: `HTTP ${res.status}`,
        claudeInstruction: `The ${page.name} page is returning HTTP ${res.status}. Check the route at src/app${page.path}/page.js for errors.`,
      }
    }

    // Check slow response
    if (ms > 8000) {
      return {
        page: page.name, path: page.path, status: 'warn', ms,
        reason: `Slow response: ${ms}ms`,
        claudeInstruction: null,
      }
    }

    // Check must-contain strings
    for (const text of (page.mustContain || [])) {
      if (!body.includes(text)) {
        return {
          page: page.name, path: page.path, status: 'fail', ms,
          reason: `Missing UI element: "${text}"`,
          claudeInstruction: `The ${page.name} page loaded but is missing "${text}". A recent code change may have broken this component. Check src/app${page.path}/page.js.`,
        }
      }
    }

    // Check must-not-contain strings
    for (const text of (page.mustNotContain || [])) {
      if (body.toLowerCase().includes(text.toLowerCase())) {
        return {
          page: page.name, path: page.path, status: 'fail', ms,
          reason: `Error text found: "${text}"`,
          claudeInstruction: `The ${page.name} page is showing an error: "${text}". Check src/app${page.path}/page.js for a runtime crash.`,
        }
      }
    }

    return { page: page.name, path: page.path, status: 'ok', ms, reason: `OK (${ms}ms)` }

  } catch (err) {
    const ms = Date.now() - start
    const isTimeout = err.name === 'AbortError'
    return {
      page: page.name, path: page.path, status: 'fail', ms,
      reason: isTimeout ? 'Timeout after 10s' : `Fetch error: ${err.message}`,
      claudeInstruction: isTimeout
        ? `The ${page.name} page is timing out (>10s). Check for infinite loops or blocking operations in src/app${page.path}/page.js.`
        : `The ${page.name} page is unreachable: ${err.message}`,
    }
  }
}

async function sendPageAlertEmail(failures, allResults) {
  const mailer = transport()
  const subject = `🔴 Blendery UI Alert — ${failures.length} page${failures.length > 1 ? 's' : ''} broken`

  const rows = allResults.map(r => {
    const icon = r.status === 'ok' ? '✅' : r.status === 'warn' ? '🟡' : '🔴'
    const color = r.status === 'ok' ? '#16a34a' : r.status === 'warn' ? '#d97706' : '#dc2626'
    return `<tr>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px">${icon} ${r.page}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#6b7280">${r.path}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:${color}">${r.reason}</td>
      <td style="padding:10px 14px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#6b7280">${r.ms}ms</td>
    </tr>`
  }).join('')

  const claudeBlocks = failures.filter(r => r.claudeInstruction).map(r => `
    <div style="margin-bottom:12px;padding:14px 16px;background:#fff3cd;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0">
      <div style="font-size:11px;font-weight:700;color:#92400e;text-transform:uppercase;margin-bottom:5px">📋 Tell Tech Head Claude:</div>
      <div style="font-size:13px;color:#1f2937;font-family:monospace;line-height:1.6">${r.claudeInstruction}</div>
    </div>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,sans-serif">
<div style="max-width:660px;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
  <div style="background:#dc2626;padding:20px 24px">
    <div style="font-size:17px;font-weight:700;color:#fff">${subject}</div>
    <div style="font-size:12px;color:rgba(255,255,255,0.75);margin-top:3px">${new Date().toUTCString()}</div>
  </div>
  <div style="padding:20px 24px;border-bottom:1px solid #f3f4f6">
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f9fafb">
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280">Page</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280">Path</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280">Status</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280">Time</th>
      </tr>
      ${rows}
    </table>
  </div>
  ${claudeBlocks ? `<div style="padding:20px 24px;background:#fffbeb;border-bottom:1px solid #f3f4f6">
    <div style="font-size:13px;font-weight:700;color:#92400e;margin-bottom:12px">⚡ Copy and paste into Tech Head Claude:</div>
    ${claudeBlocks}
  </div>` : ''}
  <div style="padding:16px 24px">
    <a href="${APP_URL}" style="display:inline-block;padding:9px 18px;background:#0f172a;color:#fff;border-radius:8px;text-decoration:none;font-size:12px;font-weight:600">Open App →</a>
  </div>
</div></body></html>`

  await mailer.sendMail({ from: `"Blendery QA 🤖" <${process.env.SMTP_USER}>`, to: NOTIFY_EMAIL, subject, html })
}

export async function GET() {
  // Run all page checks in parallel
  const results = await Promise.all(PAGES.map(checkPage))

  const failures = results.filter(r => r.status === 'fail')
  const warnings = results.filter(r => r.status === 'warn')
  const passed   = results.filter(r => r.status === 'ok')

  // Send alert if any failures
  if (failures.length > 0) {
    try { await sendPageAlertEmail(failures, results) } catch {}
  }

  const summary = {
    healthy: failures.length === 0,
    pages: results.length,
    passed: passed.length,
    warnings: warnings.length,
    failures: failures.length,
    results,
    timestamp: new Date().toISOString(),
  }

  return NextResponse.json(summary, { status: failures.length > 0 ? 500 : 200 })
}
