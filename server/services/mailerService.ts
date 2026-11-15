import nodemailer, { type Transporter } from 'nodemailer';

export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

function getFromAddress(): string {
  return (
    process.env.MAIL_FROM?.trim() ||
    process.env.SMTP_FROM?.trim() ||
    process.env.SMTP_USER?.trim() ||
    'PriceAlerter <no-reply@pricealerter.in>'
  );
}

export function isMailerConfigured(): boolean {
  const hasResend = Boolean(process.env.RESEND_API_KEY?.trim());
  const hasSmtp = Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim()
  );
  return hasResend || hasSmtp;
}

let cachedTransporter: Transporter | null = null;

function getSmtpTransporter(): Transporter | null {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS?.trim();
  if (!host || !user || !pass) return null;

  if (!cachedTransporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure =
      process.env.SMTP_SECURE === 'true' || port === 465;
    cachedTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });
  }
  return cachedTransporter;
}

export async function sendMail(options: MailOptions): Promise<boolean> {
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from = getFromAddress();

  if (resendKey) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 8000);
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [options.to],
            subject: options.subject,
            text: options.text,
            html: options.html,
          }),
        });
        if (!res.ok) {
          console.error('[Mailer] Resend delivery failed with status:', res.status);
          return false;
        }
        return true;
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      console.error('[Mailer] Resend error:', err instanceof Error ? err.message : err);
      return false;
    }
  }

  const transporter = getSmtpTransporter();
  if (transporter) {
    try {
      await transporter.sendMail({
        from,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });
      return true;
    } catch (err) {
      console.error('[Mailer] SMTP delivery failed:', err instanceof Error ? err.message : err);
      return false;
    }
  }

  return false;
}

export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  resetUrl: string;
}): Promise<boolean> {
  const subject = 'Reset Your PriceAlerter Password';
  const text = [
    `Hello ${params.name},`,
    '',
    'We received a request to reset your PriceAlerter account password.',
    `Open this link within 30 minutes to set a new password: ${params.resetUrl}`,
    '',
    'If you did not request a password reset, you can safely ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#152338;border:1px solid #e2e8f0;border-radius:12px;">
      <h2 style="margin:0 0 12px;color:#14263F;">Reset Your PriceAlerter Password</h2>
      <p style="font-size:14px;line-height:1.6;">Hello ${params.name.replace(/[<>&]/g, '')},</p>
      <p style="font-size:14px;line-height:1.6;">We received a request to reset your PriceAlerter investor account password. This link expires in <strong>30 minutes</strong>.</p>
      <p style="margin:24px 0;">
        <a href="${params.resetUrl}" style="display:inline-block;background:#14263F;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;font-size:14px;">Set New Password</a>
      </p>
      <p style="font-size:12px;color:#64748b;">If you did not request this change, you can safely ignore this message.</p>
    </div>
  `;

  return sendMail({ to: params.to, subject, text, html });
}

export async function sendPriceAlertEmail(params: {
  to: string;
  name: string;
  symbol: string;
  companyName: string;
  reason: string;
  siteBaseUrl: string;
  link: string;
}): Promise<boolean> {
  const fullLink = `${params.siteBaseUrl.replace(/\/+$/, '')}${params.link}`;
  const subject = `Price Alert Triggered: ${params.symbol} (${params.companyName})`;
  const text = [
    `Hello ${params.name},`,
    '',
    `Your PriceAlerter rule for ${params.companyName} (${params.symbol}) has triggered:`,
    params.reason,
    '',
    `View stock details: ${fullLink}`,
  ].join('\n');

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#152338;border:1px solid #e2e8f0;border-radius:12px;">
      <div style="font-size:12px;font-weight:700;color:#059669;text-transform:uppercase;letter-spacing:0.5px;">Price Alert Triggered</div>
      <h2 style="margin:6px 0 12px;color:#14263F;">${params.companyName.replace(/[<>&]/g, '')} (${params.symbol.replace(/[<>&]/g, '')})</h2>
      <p style="font-size:14px;line-height:1.6;background:#f8fafc;padding:12px;border-radius:8px;border:1px solid #e2e8f0;">${params.reason.replace(/[<>&]/g, '')}</p>
      <p style="margin:20px 0;">
        <a href="${fullLink}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600;font-size:13px;">Open Live Chart &amp; Financials</a>
      </p>
    </div>
  `;

  return sendMail({ to: params.to, subject, text, html });
}

export async function sendContactNotificationEmail(params: {
  ticketId: string;
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<boolean> {
  const recipient =
    process.env.CONTACT_NOTIFY_EMAIL?.trim() || process.env.ADMIN_EMAIL?.trim();
  if (!recipient) return false;

  const subject = `[PriceAlerter Desk] ${params.topic} (${params.ticketId})`;
  const text = [
    `Ticket ID: ${params.ticketId}`,
    `From: ${params.name} <${params.email}>`,
    `Topic: ${params.topic}`,
    '',
    params.message,
  ].join('\n');

  return sendMail({ to: recipient, subject, text });
}

export async function dispatchWebhookNotification(
  eventType: string,
  payload: Record<string, unknown>
): Promise<void> {
  const webhookUrl = process.env.ALERT_WEBHOOK_URL?.trim();
  if (!webhookUrl || !/^https?:\/\//i.test(webhookUrl)) return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(webhookUrl, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventType,
          timestamp: new Date().toISOString(),
          payload,
        }),
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Non-blocking webhook best effort
  }
}
