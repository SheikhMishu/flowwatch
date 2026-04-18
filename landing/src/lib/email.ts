import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses'

function getSesClient(): SESClient | null {
  const { AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } = process.env
  if (!AWS_REGION || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) return null
  return new SESClient({ region: AWS_REGION, credentials: { accessKeyId: AWS_ACCESS_KEY_ID, secretAccessKey: AWS_SECRET_ACCESS_KEY } })
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const from = process.env.REG_MAIL_FROM
  const ses = getSesClient()
  if (!ses || !from) {
    console.log(`[EMAIL] -> ${to}\nSubject: ${subject}`)
    return
  }
  await ses.send(new SendEmailCommand({
    Source: from,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  }))
}

function layout(content: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>FlowMonix</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:12px 12px 0 0;padding:28px 36px;">
              <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Flow</span><span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:rgba(255,255,255,0.7);">monix</span>
            </td>
          </tr>
          <tr>
            <td style="background:#ffffff;padding:36px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;">
              <p style="margin:0;font-size:12px;color:#9ca3af;line-height:1.5;">
                You received this because you signed up at flowmonix.com &middot; &copy; ${year} FlowMonix
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaBtn(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
  <tr>
    <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:8px;">
      <a href="${url}" target="_blank" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
        ${label}
      </a>
    </td>
  </tr>
</table>`
}

const APP = 'https://app.flowmonix.com'

// Email 1 — Welcome (sent immediately on signup)
export async function sendSequenceEmail1(email: string): Promise<void> {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">You're in — welcome to FlowMonix</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#6b7280;line-height:1.7;">
      FlowMonix monitors your n8n workflows, groups failures into incidents, and explains errors with AI — so you fix issues in seconds, not hours.
    </p>
    <p style="margin:0 0 8px;font-size:14px;font-weight:600;color:#374151;">Your free plan includes:</p>
    <ul style="margin:8px 0 24px;padding-left:20px;font-size:14px;color:#6b7280;line-height:2;">
      <li>1 n8n instance monitored in real-time</li>
      <li>Incident detection — failures grouped by error pattern</li>
      <li>One-click retry from the dashboard</li>
      <li>Public status page for your clients</li>
    </ul>
    <p style="margin:0 0 4px;font-size:15px;color:#6b7280;line-height:1.7;">
      Connect your first instance and you'll see failures in real-time within minutes.
    </p>
    ${ctaBtn('Open FlowMonix →', APP)}
  `)
  await sendEmail(email, "You're in — welcome to FlowMonix", html)
}

// Email 2 — Day 2: educate the pain
export async function sendSequenceEmail2(email: string): Promise<void> {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Why most n8n setups break silently</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#6b7280;line-height:1.7;">
      n8n is powerful — but it doesn't tell you <em>when</em> something stops working. Most failures are silent. The workflow errors, retries silently fail, and you find out when a client calls.
    </p>
    <p style="margin:0 0 12px;font-size:14px;font-weight:600;color:#374151;">The three patterns we catch automatically:</p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Recurring errors</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">Same node fails 10 times. n8n logs 10 entries. FlowMonix shows 1 incident with full context.</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Silent credential failures</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">API key expires overnight. Workflows stop silently. You find out at 9am when the client calls.</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:20px;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">Cascade failures</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">One upstream break triggers 6 downstream errors. Looks like 6 problems. It's 1.</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.7;">Connect your first instance and see what's been slipping through.</p>
    ${ctaBtn('Connect your n8n instance →', `${APP}/dashboard/instances`)}
  `)
  await sendEmail(email, 'Why most n8n setups break silently', html)
}

// Email 3 — Day 4: show the value loop
export async function sendSequenceEmail3(email: string): Promise<void> {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">From failure to fixed — in seconds</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#6b7280;line-height:1.7;">
      Here's exactly what happens when a workflow breaks inside FlowMonix:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom:8px;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">1 — Detected instantly</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">Real-time sync picks up the failed execution the moment it happens.</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">2 — Grouped into one incident</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">Repeated failures with the same error signature become one incident — not 40 notifications.</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">3 — AI explains root cause</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">One click. Plain English. Exact node, exact error, and step-by-step fix suggestion.</p>
      </td></tr>
    </table>
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:8px 0 20px;">
      <tr><td style="padding:12px 16px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
        <p style="margin:0 0 3px;font-size:13px;font-weight:600;color:#111827;">4 — Retry in one click</p>
        <p style="margin:0;font-size:13px;color:#6b7280;">Fix it, re-run it, mark it resolved — without ever opening n8n.</p>
      </td></tr>
    </table>
    <p style="margin:0;font-size:15px;color:#6b7280;line-height:1.7;">If you haven't connected your instance yet — it takes under 2 minutes.</p>
    ${ctaBtn('See it in your dashboard →', `${APP}/dashboard`)}
  `)
  await sendEmail(email, 'How we fix failures in seconds', html)
}

// Email 4 — Day 7: nudge
export async function sendSequenceEmail4(email: string): Promise<void> {
  const html = layout(`
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;">Still haven't connected your n8n instance?</h1>
    <p style="margin:0 0 18px;font-size:15px;color:#6b7280;line-height:1.7;">
      You signed up for FlowMonix a week ago. Your account is ready — but right now, your workflows are unmonitored.
    </p>
    <p style="margin:0 0 18px;font-size:15px;color:#6b7280;line-height:1.7;">
      Any failure happening right now — you won't know about it until a client tells you.
    </p>
    <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#374151;">Connecting takes 2 minutes:</p>
    <ol style="margin:0 0 24px;padding-left:20px;font-size:14px;color:#6b7280;line-height:2.2;">
      <li>Go to Instances &rarr; Add Instance</li>
      <li>Paste your n8n URL + API key</li>
      <li>Click Test &rarr; Save</li>
    </ol>
    <p style="margin:0;font-size:14px;color:#6b7280;">That's it. Monitoring starts immediately.</p>
    ${ctaBtn('Connect your instance now →', `${APP}/dashboard/instances`)}
    <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">
      If FlowMonix isn't the right fit, no hard feelings — this is the last email in this sequence.
    </p>
  `)
  await sendEmail(email, "Still haven't connected your n8n instance?", html)
}
