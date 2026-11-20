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

export async function sendIpoDigestEmail(params: {
  to: string;
  name: string;
  openedIpos: Array<{
    companyName: string;
    slug: string;
    category?: string;
    priceBand?: string;
    issueSize?: string;
    closeDate?: string | null;
    gmp?: string;
  }>;
  gainers: Array<{
    symbol: string;
    companyName: string;
    price: number;
    changePercent: number;
  }>;
  siteBaseUrl?: string;
}): Promise<boolean> {
  const siteUrl = (params.siteBaseUrl || process.env.PUBLIC_SITE_URL || 'https://pricealerter.in').replace(/\/+$/, '');
  const subject = `📊 PriceAlerter Market Digest: Open IPOs & Top Equity Gainers`;

  const ipoRows = params.openedIpos.length > 0
    ? params.openedIpos.map((ipo) => `
        <tr style="border-bottom:1px solid #e2e8f0;">
          <td style="padding:10px 8px;font-weight:600;color:#0f172a;">
            ${ipo.companyName.replace(/[<>&"]/g, '')}
            <div style="font-size:11px;color:#64748b;font-weight:400;">${(ipo.category || 'Mainboard').replace(/[<>&"]/g, '')} &bull; Closes: ${(ipo.closeDate || 'Upcoming').replace(/[<>&"]/g, '')}</div>
          </td>
          <td style="padding:10px 8px;font-size:12px;color:#0f172a;">${(ipo.priceBand || '—').replace(/[<>&"]/g, '')}</td>
          <td style="padding:10px 8px;font-size:12px;color:#0f172a;">${(ipo.issueSize || '—').replace(/[<>&"]/g, '')}</td>
          <td style="padding:10px 8px;font-size:12px;font-weight:700;color:#059669;">${(ipo.gmp || '—').replace(/[<>&"]/g, '')}</td>
          <td style="padding:10px 8px;text-align:right;">
            <a href="${siteUrl}/ipo/${ipo.slug}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:4px 10px;border-radius:4px;font-size:11px;font-weight:600;">View & Bid &rarr;</a>
          </td>
        </tr>
      `).join('')
    : '<tr><td colspan="5" style="padding:12px;text-align:center;color:#64748b;font-size:12px;">No open public issues today. Check upcoming calendar below.</td></tr>';

  const gainerRows = params.gainers.slice(0, 5).map((g) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:8px;font-weight:600;color:#0f172a;">${g.symbol.replace(/[<>&"]/g, '')} <span style="font-size:11px;color:#64748b;font-weight:400;">${g.companyName.replace(/[<>&"]/g, '')}</span></td>
      <td style="padding:8px;font-size:12px;color:#0f172a;">₹${g.price.toFixed(2)}</td>
      <td style="padding:8px;font-size:12px;font-weight:700;color:#059669;">+${g.changePercent.toFixed(2)}%</td>
      <td style="padding:8px;text-align:right;">
        <a href="${siteUrl}/stock/${g.symbol}" style="color:#2563eb;text-decoration:none;font-size:11px;font-weight:600;">Chart &rarr;</a>
      </td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <!-- Brand Header with Logo -->
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #059669;padding-bottom:14px;margin-bottom:20px;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <div style="background:#14263F;padding:6px;border-radius:8px;display:inline-block;">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M8.5 27.5L15.5 20L21.5 23.5L30.5 12.5" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25.5 12.5H30.5V17.5" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="30.5" cy="12.5" r="2.5" fill="#34D399"/>
              <path d="M8.5 31.5H31.5" stroke="#334E72" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#14263F;letter-spacing:-0.5px;">Price<span style="color:#059669;">Alerter</span></div>
            <div style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:700;letter-spacing:0.5px;">Investor Intelligence &amp; IPO Analytics</div>
          </div>
        </div>
        <div style="text-align:right;font-size:11px;color:#64748b;">10-Day Market Digest</div>
      </div>

      <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">Hello <strong>${params.name.replace(/[<>&"]/g, '')}</strong>,</p>
      <p style="font-size:13px;line-height:1.6;color:#334155;margin:0 0 16px;">
        Here is your 10-day market digest featuring newly opened IPOs, current Grey Market Premium (GMP) indicators, and top equity gainers on NSE &amp; BSE.
      </p>

      <!-- Open IPOs Section -->
      <div style="margin-bottom:24px;">
        <div style="font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;border-left:3px solid #059669;padding-left:8px;">
          Newly Opened Public Offerings (IPOs)
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:12px;">
          <thead>
            <tr style="background:#f8fafc;color:#475569;text-align:left;border-bottom:1px solid #cbd5e1;">
              <th style="padding:8px;">IPO Name</th>
              <th style="padding:8px;">Price Band</th>
              <th style="padding:8px;">Issue Size</th>
              <th style="padding:8px;">Est. GMP</th>
              <th style="padding:8px;text-align:right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${ipoRows}
          </tbody>
        </table>
      </div>

      <!-- Top Gainers Section -->
      ${params.gainers.length > 0 ? `
        <div style="margin-bottom:24px;">
          <div style="font-size:13px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;border-left:3px solid #2563eb;padding-left:8px;">
            Top Market Gainers (Listed Equities)
          </div>
          <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:12px;">
            <thead>
              <tr style="background:#f8fafc;color:#475569;text-align:left;border-bottom:1px solid #cbd5e1;">
                <th style="padding:8px;">Security</th>
                <th style="padding:8px;">LTP</th>
                <th style="padding:8px;">Change</th>
                <th style="padding:8px;text-align:right;">Details</th>
              </tr>
            </thead>
            <tbody>
              ${gainerRows}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Crucial Advisory Notice -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #059669;border-radius:8px;padding:14px;margin-bottom:20px;">
        <div style="font-weight:700;color:#166534;font-size:13px;margin-bottom:4px;">💡 Investor Guidance &amp; Personal Discretion</div>
        <div style="font-size:12px;color:#14532d;line-height:1.5;">
          Every investor has distinct financial goals and risk capacities. We strongly recommend evaluating company financials, debt obligations, valuation ratios, and DRHP risk disclosures before participating.
          <strong>Please invest strictly based on your personal interest, risk tolerance, and independent financial research.</strong>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div style="text-align:center;margin:24px 0;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        <a href="${siteUrl}/ipo" style="display:inline-block;background:#14263F;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:13px;">
          Explore Live IPOs &amp; GMP &rarr;
        </a>
        <a href="${siteUrl}/stock-screener" style="display:inline-block;background:#f1f5f9;color:#0f172a;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:13px;border:1px solid #cbd5e1;">
          Stock Screener &amp; Ratios
        </a>
      </div>

      <!-- Future News & Calendar -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:20px;font-size:12px;color:#475569;">
        <div style="font-weight:700;color:#1e293b;margin-bottom:4px;">📅 Upcoming IPO Pipeline &amp; Listing News</div>
        <div>Keep track of upcoming Mainboard &amp; SME public issues, basis of allotment timelines, and listing ceremony schedules on the PriceAlerter live calendar.</div>
        <div style="margin-top:6px;"><a href="${siteUrl}/calendar" style="color:#2563eb;font-weight:600;text-decoration:none;">View Full 2026 IPO Calendar &rarr;</a></div>
      </div>

      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;" />
      <div style="font-size:11px;color:#64748b;line-height:1.5;text-align:center;">
        You received this automated update because you are registered on <a href="${siteUrl}" style="color:#2563eb;">PriceAlerter.in</a>.<br/>
        PriceAlerter does not provide stock recommendations. All investments are subject to market risks.<br/>
        Update notification preferences anytime at <a href="${siteUrl}/profile" style="color:#2563eb;">pricealerter.in/profile</a>.
      </div>
    </div>
  `;

  const text = `PriceAlerter Market Digest\n\nHello ${params.name},\n\nCheck out the latest open IPOs, GMP trends, and top gainers on PriceAlerter: ${siteUrl}/ipo\n\nInvest strictly based on your personal interest and risk profile.\n\nManage preferences: ${siteUrl}/profile`;

  return sendMail({ to: params.to, subject, text, html });
}

export async function sendHighSubscriptionAlertEmail(params: {
  to: string;
  name: string;
  ipo: {
    companyName: string;
    slug: string;
    category?: string;
    priceBand?: string;
    issueSize?: string;
    qibSubscription?: number | null;
    niiSubscription?: number | null;
    retailSubscription?: number | null;
    totalSubscription?: number | null;
    latestGmp?: number | null;
    expectedGainPercent?: number | null;
  };
  subscriptionX: number;
  siteBaseUrl?: string;
}): Promise<boolean> {
  const siteUrl = (params.siteBaseUrl || process.env.PUBLIC_SITE_URL || 'https://pricealerter.in').replace(/\/+$/, '');
  const reportUrl = `${siteUrl}/api/ipo/${params.ipo.slug}/report`;
  const subject = `🔥 High Demand Alert: ${params.ipo.companyName} Subscribed ${params.subscriptionX.toFixed(2)}x — Detailed PDF Report & Analysis`;

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:620px;margin:0 auto;padding:24px;color:#0f172a;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
      <!-- Brand Header with Logo -->
      <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:2px solid #ea580c;padding-bottom:14px;margin-bottom:20px;">
        <div style="display:inline-flex;align-items:center;gap:10px;">
          <div style="background:#14263F;padding:6px;border-radius:8px;display:inline-block;">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <path d="M8.5 27.5L15.5 20L21.5 23.5L30.5 12.5" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M25.5 12.5H30.5V17.5" stroke="#059669" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="30.5" cy="12.5" r="2.5" fill="#34D399"/>
              <path d="M8.5 31.5H31.5" stroke="#334E72" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <div style="font-size:20px;font-weight:800;color:#14263F;letter-spacing:-0.5px;">Price<span style="color:#059669;">Alerter</span></div>
            <div style="font-size:10px;text-transform:uppercase;color:#ea580c;font-weight:700;letter-spacing:0.5px;">🔥 Bumper Subscription Alert (&gt;20x)</div>
          </div>
        </div>
        <div style="text-align:right;font-size:11px;font-weight:700;color:#c2410c;background:#fff7ed;padding:4px 8px;border-radius:4px;border:1px solid #fdba74;">
          ${params.subscriptionX.toFixed(2)}x Oversubscribed
        </div>
      </div>

      <p style="font-size:14px;line-height:1.6;margin:0 0 14px;">Hello <strong>${params.name.replace(/[<>&"]/g, '')}</strong>,</p>

      <div style="background:#fff7ed;border:1px solid #fdba74;border-left:4px solid #ea580c;border-radius:8px;padding:14px;margin-bottom:20px;">
        <div style="font-weight:800;color:#9a3412;font-size:15px;margin-bottom:4px;">
          Heavy Market Demand: ${params.ipo.companyName.replace(/[<>&"]/g, '')}
        </div>
        <div style="font-size:13px;color:#7c2d12;line-height:1.5;">
          The public issue of <strong>${params.ipo.companyName.replace(/[<>&"]/g, '')}</strong> has witnessed massive bidding interest with subscriptions crossing the <strong>${params.subscriptionX.toFixed(2)}x milestone</strong>.
        </div>
      </div>

      <!-- Subscription Breakdown -->
      <div style="margin-bottom:20px;">
        <div style="font-size:12px;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">
          Official Bidding Breakdown (NSE &amp; BSE)
        </div>
        <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;font-size:12px;">
          <thead>
            <tr style="background:#f8fafc;color:#475569;text-align:left;border-bottom:1px solid #cbd5e1;">
              <th style="padding:8px;">Category</th>
              <th style="padding:8px;">Subscription Multiple</th>
              <th style="padding:8px;">Demand Level</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px;font-weight:600;">QIB (Institutions)</td>
              <td style="padding:8px;font-weight:700;color:#0f172a;">${params.ipo.qibSubscription != null ? params.ipo.qibSubscription.toFixed(2) + 'x' : '—'}</td>
              <td style="padding:8px;">${(params.ipo.qibSubscription || 0) >= 20 ? '<span style="color:#ea580c;font-weight:700;">🔥 Bumper (&gt;20x)</span>' : 'High'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px;font-weight:600;">NII / HNI</td>
              <td style="padding:8px;font-weight:700;color:#0f172a;">${params.ipo.niiSubscription != null ? params.ipo.niiSubscription.toFixed(2) + 'x' : '—'}</td>
              <td style="padding:8px;">${(params.ipo.niiSubscription || 0) >= 20 ? '<span style="color:#ea580c;font-weight:700;">🔥 Bumper (&gt;20x)</span>' : 'High'}</td>
            </tr>
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:8px;font-weight:600;">Retail (RII)</td>
              <td style="padding:8px;font-weight:700;color:#0f172a;">${params.ipo.retailSubscription != null ? params.ipo.retailSubscription.toFixed(2) + 'x' : '—'}</td>
              <td style="padding:8px;">Normal / High</td>
            </tr>
            <tr style="background:#f8fafc;font-weight:700;">
              <td style="padding:8px;">Total Issue Subscription</td>
              <td style="padding:8px;color:#059669;font-size:14px;">${params.ipo.totalSubscription != null ? params.ipo.totalSubscription.toFixed(2) + 'x' : params.subscriptionX.toFixed(2) + 'x'}</td>
              <td style="padding:8px;color:#059669;">Overall Demand</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Offering Details & GMP -->
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:20px;font-size:12px;">
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #e2e8f0;">
          <span style="color:#64748b;">Price Band:</span>
          <span style="font-weight:600;color:#0f172a;">${(params.ipo.priceBand || '—').replace(/[<>&"]/g, '')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px dashed #e2e8f0;">
          <span style="color:#64748b;">Issue Size:</span>
          <span style="font-weight:600;color:#0f172a;">${(params.ipo.issueSize || '—').replace(/[<>&"]/g, '')}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:4px 0;">
          <span style="color:#64748b;">Latest Grey Market Premium (GMP):</span>
          <span style="font-weight:700;color:#059669;">${params.ipo.latestGmp != null ? '₹' + params.ipo.latestGmp : '—'} ${params.ipo.expectedGainPercent != null ? '(+' + params.ipo.expectedGainPercent + '%)' : ''}</span>
        </div>
      </div>

      <!-- Action Buttons: PDF Download + Live Dashboard -->
      <div style="text-align:center;margin:24px 0;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">
        <a href="${reportUrl}" style="display:inline-block;background:#059669;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:700;font-size:13px;box-shadow:0 2px 6px rgba(5,150,105,0.25);">
          📄 Download Detailed Research PDF &rarr;
        </a>
        <a href="${siteUrl}/ipo/${params.ipo.slug}" style="display:inline-block;background:#14263F;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:13px;">
          View Full Dashboard &rarr;
        </a>
      </div>

      <!-- Guidance notice -->
      <div style="background:#f0fdf4;border:1px solid #86efac;border-left:4px solid #059669;border-radius:8px;padding:12px;margin-bottom:20px;font-size:12px;color:#14532d;line-height:1.5;">
        <strong>Notice for Investors:</strong> While heavy subscription signifies strong institutional participation, it does not guarantee listing gains. Please analyze valuation metrics, debt position, and invest strictly based on your personal interest and risk capacity.
      </div>

      <hr style="border:0;border-top:1px solid #e2e8f0;margin:20px 0;" />
      <div style="font-size:11px;color:#64748b;line-height:1.5;text-align:center;">
        PriceAlerter &bull; Independent Indian Financial Intelligence Platform<br/>
        Visit: <a href="${siteUrl}" style="color:#2563eb;">https://pricealerter.in</a> &bull; Preferences: <a href="${siteUrl}/profile" style="color:#2563eb;">pricealerter.in/profile</a>
      </div>
    </div>
  `;

  const text = `PriceAlerter Bumper Subscription Alert\n\n${params.ipo.companyName} has crossed ${params.subscriptionX.toFixed(2)}x subscription!\n\nView details and download research report: ${reportUrl}\n\nInvest based on your personal interest and risk appetite.`;

  return sendMail({ to: params.to, subject, text, html });
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
