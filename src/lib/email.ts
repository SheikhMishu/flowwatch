// Email sending via Amazon SES
// Falls back to console.log when AWS credentials are absent (local dev without SES)

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { logger } from "@/lib/logger";

function getSesClient(): SESClient | null {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
  if (!region || !accessKeyId || !secretAccessKey) return null;
  return new SESClient({ region, credentials: { accessKeyId, secretAccessKey } });
}

async function sendEmail({
  to,
  subject,
  html,
  fromEnvKey,
}: {
  to: string;
  subject: string;
  html: string;
  fromEnvKey: "REG_MAIL_FROM" | "NOTIFY_MAIL_FROM";
}): Promise<void> {
  const from = process.env[fromEnvKey];
  const ses = getSesClient();

  if (!ses || !from) {
    console.log(`\n[EMAIL] [${fromEnvKey}] -> ${to}\nSubject: ${subject}\n`);
    return;
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: from,
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: subject, Charset: "UTF-8" },
          Body: { Html: { Data: html, Charset: "UTF-8" } },
        },
      })
    );
  } catch (err) {
    logger.error("SES send failed", { category: "email", to, subject, fromEnvKey, err });
    throw err;
  }
}

// --- Shared layout wrapper ---
// Email-safe HTML: inline styles only, no external resources, table-based layout
// for Outlook compatibility. Max width 560px works across all major clients.

function emailLayout(content: string, footerNote?: string): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.flowmonix.com";
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>FlowMonix</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:12px 12px 0 0;padding:28px 36px;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td>
                    <!-- Wordmark: "Flow" white + "monix" white/70 -->
                    <span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Flow</span><span style="font-size:22px;font-weight:700;letter-spacing:-0.5px;color:rgba(255,255,255,0.7);">monix</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:#ffffff;padding:36px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">
              ${content}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;">
              <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;line-height:1.5;">
                ${footerNote ?? "You received this email because an action was taken on your FlowMonix account."}
              </p>
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                <a href="${appUrl}/dashboard" style="color:#6366f1;text-decoration:none;">Open dashboard</a>
                &nbsp;&middot;&nbsp;
                <a href="${appUrl}/dashboard/settings" style="color:#6366f1;text-decoration:none;">Account settings</a>
                &nbsp;&middot;&nbsp;
                &copy; ${year} FlowMonix
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Reusable CTA button (gradient, email-safe)
function ctaButton(label: string, url: string): string {
  return `<table cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
    <tr>
      <td style="background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 100%);border-radius:8px;">
        <a href="${url}" target="_blank"
           style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.01em;">
          ${label}
        </a>
      </td>
    </tr>
  </table>`;
}

// --- Auth emails (PIN, invite) ---

export async function sendPinEmail(email: string, pin: string): Promise<void> {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">
      Your verification code
    </h1>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
      Enter the code below to sign in to FlowMonix. It expires in <strong style="color:#374151;">10 minutes</strong>.
    </p>

    <!-- PIN display -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td align="center" style="background:#f3f4f6;border-radius:12px;padding:28px 16px;">
          <span style="font-size:36px;font-weight:700;letter-spacing:12px;color:#111827;font-variant-numeric:tabular-nums;">
            ${pin}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
      If you did not request this code, you can safely ignore this email. Someone may have entered your email address by mistake.
    </p>
  `;

  await sendEmail({
    to: email,
    subject: `${pin} is your FlowMonix verification code`,
    fromEnvKey: "REG_MAIL_FROM",
    html: emailLayout(content, "You received this because someone requested a sign-in code for this email address."),
  });
}

export async function sendInviteEmail(
  email: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
): Promise<void> {
  const content = `
    <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.3px;">
      You have been invited
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
      <strong style="color:#374151;">${inviterName}</strong> has invited you to join
      <strong style="color:#374151;">${orgName}</strong> on FlowMonix &mdash; the n8n workflow monitoring platform.
    </p>

    <!-- Org card -->
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:4px;">
      <tr>
        <td style="padding:16px 20px;">
          <p style="margin:0 0 4px;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">
            Workspace
          </p>
          <p style="margin:0;font-size:16px;font-weight:600;color:#111827;">${orgName}</p>
        </td>
      </tr>
    </table>

    ${ctaButton("Accept invitation", inviteUrl)}

    <p style="margin:20px 0 0;font-size:13px;color:#9ca3af;line-height:1.6;">
      This invitation expires in <strong style="color:#6b7280;">7 days</strong>.
      If you were not expecting this, you can safely ignore it &mdash; no account will be created.
    </p>
  `;

  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${orgName} on FlowMonix`,
    fromEnvKey: "REG_MAIL_FROM",
    html: emailLayout(content, `You received this because ${inviterName} sent you a workspace invitation.`),
  });
}

// --- Notification emails ---
// Alert HTML is built in alert-engine.ts; this function handles delivery only.

export async function sendAlertEmail(
  email: string,
  subject: string,
  html: string
): Promise<void> {
  await sendEmail({ to: email, subject, fromEnvKey: "NOTIFY_MAIL_FROM", html });
}

// Contact form — sends to support@flowmonix.com with reply-to set to sender
export async function sendContactEmail(opts: {
  senderName: string;
  senderEmail: string;
  orgName: string;
  subject: string;
  message: string;
}): Promise<void> {
  const { senderName, senderEmail, orgName, subject, message } = opts;
  const from = process.env.NOTIFY_MAIL_FROM;
  const ses = getSesClient();
  const to = "support@flowmonix.com";

  const content = `
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:700;color:#111827;">New support request</h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
      <tr><td style="padding:16px 20px;">
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
          <strong style="color:#374151;">From:</strong> ${senderName} &lt;${senderEmail}&gt;
        </p>
        <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">
          <strong style="color:#374151;">Workspace:</strong> ${orgName}
        </p>
        <p style="margin:0;font-size:13px;color:#6b7280;">
          <strong style="color:#374151;">Subject:</strong> ${subject}
        </p>
      </td></tr>
    </table>
    <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#374151;">Message:</p>
    <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;white-space:pre-wrap;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
  `;

  if (!ses || !from) {
    console.log(`\n[CONTACT] From: ${senderName} (${orgName}) <${senderEmail}>\nSubject: ${subject}\n${message}\n`);
    return;
  }

  try {
    await ses.send(
      new SendEmailCommand({
        Source: from,
        ReplyToAddresses: [senderEmail],
        Destination: { ToAddresses: [to] },
        Message: {
          Subject: { Data: `[Support] ${subject}`, Charset: "UTF-8" },
          Body: { Html: { Data: emailLayout(content, "Internal support notification."), Charset: "UTF-8" } },
        },
      })
    );
  } catch (err) {
    logger.error("SES contact send failed", { category: "email", senderEmail, subject, err });
    throw err;
  }
}

// Export layout helpers for use in alert-engine.ts
export { emailLayout, ctaButton };
