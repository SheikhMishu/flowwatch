// Email sending via Amazon SES
// Falls back to console.log when AWS credentials are absent (local dev without SES)

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

function getSesClient(): SESClient | null {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) return null;

  return new SESClient({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
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
    // Dev fallback
    console.log(`\n📧 [${fromEnvKey}] → ${to}\nSubject: ${subject}\n`);
    return;
  }

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
}

// ─── Auth emails (PIN, invite) ────────────────────────────────────────────────

export async function sendPinEmail(email: string, pin: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Your FlowMonix verification code: ${pin}`,
    fromEnvKey: "REG_MAIL_FROM",
    html: `
      <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:40px 20px;">
        <h2 style="color:#1a1a2e;margin-bottom:8px;">FlowMonix verification code</h2>
        <p style="color:#6b7280;margin-bottom:24px;">Enter this code to sign in. It expires in 10 minutes.</p>
        <div style="background:#f3f4f6;border-radius:12px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#1a1a2e;">
          ${pin}
        </div>
        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendInviteEmail(
  email: string,
  orgName: string,
  inviterName: string,
  inviteUrl: string
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `${inviterName} invited you to join ${orgName} on FlowMonix`,
    fromEnvKey: "REG_MAIL_FROM",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:40px 20px;">
        <h2 style="color:#1a1a2e;margin-bottom:8px;">You've been invited</h2>
        <p style="color:#6b7280;margin-bottom:24px;">
          <strong style="color:#1a1a2e;">${inviterName}</strong> invited you to join
          <strong style="color:#1a1a2e;">${orgName}</strong> on FlowMonix.
        </p>
        <a href="${inviteUrl}"
           style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:15px;">
          Accept invitation
        </a>
        <p style="color:#9ca3af;font-size:12px;margin-top:32px;">
          This invitation expires in 7 days. If you didn't expect this, you can safely ignore it.
        </p>
      </div>
    `,
  });
}

// ─── Notification emails ──────────────────────────────────────────────────────
// Placeholder for future alert/digest emails — uses NOTIFY_MAIL_FROM

export async function sendAlertEmail(
  email: string,
  subject: string,
  html: string
): Promise<void> {
  await sendEmail({ to: email, subject, fromEnvKey: "NOTIFY_MAIL_FROM", html });
}
