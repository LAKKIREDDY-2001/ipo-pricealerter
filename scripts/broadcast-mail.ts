import 'dotenv/config';
import nodemailer from 'nodemailer';

export type NotificationCategory = 'ALL' | 'IPO_REMINDER' | 'GMP_CHANGE' | 'PRICE_ALERT' | 'MARKET_UPDATE';

export interface BroadcastOptions {
  category: NotificationCategory;
  subject: string;
  title?: string;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
  dryRun?: boolean;
  recipients?: Array<{ name: string; email: string; preferences?: Record<string, boolean> }>;
}

export function buildBrandedEmailHtml(params: {
  name: string;
  title: string;
  category: NotificationCategory;
  message: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const safeName = params.name.replace(/[<>&"]/g, '');
  const safeTitle = params.title.replace(/[<>&"]/g, '');
  const ctaLabel = (params.ctaLabel || 'Open PriceAlerter').replace(/[<>&"]/g, '');
  const ctaUrl = params.ctaUrl || 'https://pricealerter.in';
  const categoryLabel = params.category.replace(/_/g, ' ');

  // Format paragraphs nicely
  const formattedBody = params.message
    .split('\n\n')
    .map((p) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#152338;">${p.replace(/[<>&"]/g, '').replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:24px 12px;background:#f6f8fb;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
    <!-- Header -->
    <div style="background:#14263F;padding:20px 24px;">
      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td>
            <div style="color:#ffffff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">PriceAlerter<span style="color:#10b981;">.in</span></div>
            <div style="color:#94a3b8;font-size:11px;margin-top:2px;">Live IPO GMP, Stock Alerter & Market Intelligence</div>
          </td>
          <td style="text-align:right;">
            <span style="display:inline-block;background:#059669;color:#ffffff;font-size:10px;font-weight:700;padding:4px 8px;border-radius:4px;text-transform:uppercase;letter-spacing:0.5px;">${categoryLabel}</span>
          </td>
        </tr>
      </table>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px;">
      <h1 style="margin:0 0 16px;color:#14263F;font-size:20px;font-weight:700;line-height:1.3;">${safeTitle}</h1>
      <p style="margin:0 0 16px;font-size:14px;color:#64748b;">Hello <strong>${safeName}</strong>,</p>

      <div style="background:#f8fafc;border-left:4px solid #059669;border-top:1px solid #e2e8f0;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;border-radius:0 8px 8px 0;padding:16px 18px;margin-bottom:24px;">
        ${formattedBody}
      </div>

      <div style="text-align:center;margin:28px 0;">
        <a href="${ctaUrl}" style="display:inline-block;background:#14263F;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;box-shadow:0 2px 4px rgba(20,38,63,0.15);">
          ${ctaLabel} &rarr;
        </a>
      </div>

      <hr style="border:0;border-top:1px solid #e2e8f0;margin:28px 0 20px;" />

      <!-- Footer -->
      <div style="font-size:11px;color:#94a3b8;line-height:1.5;">
        <p style="margin:0 0 8px;">
          You received this email because you opted into <strong>${categoryLabel}</strong> alerts on PriceAlerter.
        </p>
        <p style="margin:0;">
          Manage notification settings: <a href="https://pricealerter.in/profile" style="color:#2563eb;text-decoration:underline;">pricealerter.in/profile</a> &bull;
          Market Data Disclaimer: Data is compiled from official exchanges (NSE/BSE) and verified market sources for educational tracking.
        </p>
      </div>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export async function sendBroadcast(options: BroadcastOptions): Promise<{
  totalEligible: number;
  sentCount: number;
  recipients: string[];
  errors: Array<{ email: string; error: string }>;
}> {
  const {
    category,
    subject,
    title = subject,
    message,
    ctaLabel,
    ctaUrl = 'https://pricealerter.in',
    dryRun = false,
  } = options;

  let recipients = options.recipients || [];

  // Filter recipients based on preferences if preferences are provided
  const eligible = recipients.filter((r) => {
    if (!r.email) return false;
    if (category === 'ALL') return true;
    if (!r.preferences) return true;
    if (category === 'PRICE_ALERT') return Boolean(r.preferences.emailAlerts);
    if (category === 'IPO_REMINDER') return Boolean(r.preferences.ipoReminders);
    if (category === 'GMP_CHANGE') return Boolean(r.preferences.gmpAlerts);
    if (category === 'MARKET_UPDATE') return true;
    return true;
  });

  console.log(`[Broadcast] Category: ${category}`);
  console.log(`[Broadcast] Eligible recipients: ${eligible.length} / ${recipients.length}`);
  console.log(`[Broadcast] Subject: ${subject}`);

  if (dryRun) {
    console.log('[Broadcast] Dry-run enabled. No emails will be transmitted.');
    return {
      totalEligible: eligible.length,
      sentCount: 0,
      recipients: eligible.map((r) => r.email),
      errors: [],
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const mailFrom = process.env.MAIL_FROM?.trim() || 'PriceAlerter <no-reply@pricealerter.in>';

  const errors: Array<{ email: string; error: string }> = [];
  let sentCount = 0;

  // Delivery via Resend Batch API
  if (resendApiKey) {
    console.log('[Broadcast] Sending via Resend Batch API...');
    const emailBatch = eligible.map((r) => ({
      from: mailFrom,
      to: [r.email],
      subject,
      html: buildBrandedEmailHtml({
        name: r.name,
        title,
        category,
        message,
        ctaLabel,
        ctaUrl,
      }),
      text: `Hello ${r.name},\n\n${title}\n\n${message}\n\n${ctaUrl}\n\nManage preferences: https://pricealerter.in/profile`,
    }));

    for (let i = 0; i < emailBatch.length; i += 100) {
      const slice = emailBatch.slice(i, i + 100);
      try {
        const res = await fetch('https://api.resend.com/emails/batch', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(slice),
        });

        if (!res.ok) {
          const body = await res.text();
          console.error(`[Broadcast] Resend batch failed (${res.status}): ${body}`);
          for (const item of slice) {
            errors.push({ email: item.to[0], error: `Resend status ${res.status}: ${body}` });
          }
        } else {
          sentCount += slice.length;
          console.log(`[Broadcast] Successfully dispatched batch of ${slice.length} emails.`);
        }
      } catch (err: any) {
        console.error(`[Broadcast] Network error during batch: ${err.message}`);
        for (const item of slice) {
          errors.push({ email: item.to[0], error: err.message });
        }
      }
    }
  } else if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    // Delivery via SMTP
    console.log('[Broadcast] Sending via SMTP pool...');
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      pool: true,
      maxConnections: 5,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    for (const r of eligible) {
      try {
        await transporter.sendMail({
          from: mailFrom,
          to: r.email,
          subject,
          html: buildBrandedEmailHtml({
            name: r.name,
            title,
            category,
            message,
            ctaLabel,
            ctaUrl,
          }),
          text: `Hello ${r.name},\n\n${title}\n\n${message}\n\n${ctaUrl}\n\nManage preferences: https://pricealerter.in/profile`,
        });
        sentCount += 1;
      } catch (err: any) {
        errors.push({ email: r.email, error: err.message });
      }
    }
  } else {
    console.warn('[Broadcast] No RESEND_API_KEY or SMTP credentials configured in environment.');
    console.warn('[Broadcast] Add RESEND_API_KEY="re_..." or SMTP_* credentials to .env to send live emails.');
  }

  return {
    totalEligible: eligible.length,
    sentCount,
    recipients: eligible.map((r) => r.email),
    errors,
  };
}

// CLI entry point
if (process.argv[1]?.endsWith('broadcast-mail.ts')) {
  const args = process.argv.slice(2);
  const getArg = (name: string) => {
    const prefix = `--${name}=`;
    const found = args.find((a) => a.startsWith(prefix));
    return found ? found.slice(prefix.length) : null;
  };

  const category = (getArg('category') || 'ALL') as NotificationCategory;
  const subject = getArg('subject') || 'PriceAlerter Market Update';
  const title = getArg('title') || subject;
  const message = getArg('message') || getArg('body') || 'A new market event has been recorded.';
  const ctaLabel = getArg('cta-label') || 'View Details';
  const ctaUrl = getArg('cta-url') || 'https://pricealerter.in';
  const dryRun = args.includes('--dry-run');

  const recipientsJson = getArg('recipients');
  let recipients = [
    {
      name: 'Madhava',
      email: 'madhava@pricealerter.in',
      preferences: { emailAlerts: true, browserNotifications: true, ipoReminders: true, gmpAlerts: true },
    },
  ];

  if (recipientsJson) {
    try {
      recipients = JSON.parse(recipientsJson);
    } catch {
      console.error('[Broadcast] Invalid JSON in --recipients argument.');
    }
  }

  void sendBroadcast({
    category,
    subject,
    title,
    message,
    ctaLabel,
    ctaUrl,
    dryRun,
    recipients,
  }).then((res) => {
    console.log('[Broadcast] Complete:', res);
  });
}
