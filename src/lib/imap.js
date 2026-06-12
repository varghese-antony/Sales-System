// ─── Shared IMAP utility ─────────────────────────────────────────────────────
// saveToSentFolder was copy-pasted verbatim in send-email and send-followup.
// One place to fix, one place to test.

import { ImapFlow } from 'imapflow'

export async function saveToSentFolder(rawMessage) {
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
  } catch {
    // Non-fatal — email was sent, just not saved to Sent folder
  }
}
