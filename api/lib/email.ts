/**
 * Email module — powered by Resend.
 * All functions are fire-and-forget safe: errors are caught and logged, never rethrown.
 */

async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  apiKey: string;
  from?: string;
}): Promise<void> {
  const from = opts.from || process.env.RESEND_FROM_EMAIL || 'noreply@repliexa.com';
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${opts.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to: opts.to, subject: opts.subject, html: opts.html }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend error ${res.status}: ${err}`);
  }
}

function getApiKey(config?: any): string {
  return config?.resend_api_key || process.env.RESEND_API_KEY || '';
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function bookingConfirmationHtml(p: {
  visitorName: string;
  sessionName: string;
  startTime: string;
  endTime: string;
  meetLink?: string;
  businessName: string;
}): string {
  const start = new Date(p.startTime);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px">
      <h2 style="color:#06b6d4;margin-bottom:8px">Booking Confirmed ✓</h2>
      <p>Hi ${p.visitorName || 'there'},</p>
      <p>Your booking with <strong>${p.businessName}</strong> is confirmed.</p>
      <div style="background:#111;border:1px solid #1e3a4a;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Session:</strong> ${p.sessionName}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${start.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="margin:4px 0"><strong>Time:</strong> ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} – ${new Date(p.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        ${p.meetLink ? `<p style="margin:8px 0"><a href="${p.meetLink}" style="color:#06b6d4;font-weight:bold">Join Google Meet →</a></p>` : ''}
      </div>
      <p style="color:#666;font-size:12px">Powered by Repliexa</p>
    </div>`;
}

function ownerBookingAlertHtml(p: {
  visitorName: string;
  visitorEmail: string;
  sessionName: string;
  startTime: string;
  paymentReference?: string;
}): string {
  const start = new Date(p.startTime);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px">
      <h2 style="color:#06b6d4">New Booking 🎉</h2>
      <div style="background:#111;border:1px solid #1e3a4a;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Visitor:</strong> ${p.visitorName} (${p.visitorEmail})</p>
        <p style="margin:4px 0"><strong>Session:</strong> ${p.sessionName}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${start.toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        <p style="margin:4px 0"><strong>Time:</strong> ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        ${p.paymentReference ? `<p style="margin:4px 0"><strong>Payment Ref:</strong> ${p.paymentReference}</p>` : ''}
      </div>
      <p style="color:#666;font-size:12px">Powered by Repliexa</p>
    </div>`;
}

function paymentReceiptHtml(p: {
  visitorEmail: string;
  productName: string;
  amount: number;
  currency: string;
  reference: string;
  businessName: string;
}): string {
  const symbol = p.currency === 'NGN' ? '₦' : p.currency === 'USD' ? '$' : p.currency === 'GBP' ? '£' : '€';
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px">
      <h2 style="color:#22c55e">Payment Confirmed ✓</h2>
      <p>Thank you for your purchase from <strong>${p.businessName}</strong>.</p>
      <div style="background:#111;border:1px solid #1e3a4a;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Product:</strong> ${p.productName}</p>
        <p style="margin:4px 0"><strong>Amount:</strong> ${symbol}${p.amount.toLocaleString()}</p>
        <p style="margin:4px 0"><strong>Reference:</strong> ${p.reference}</p>
        <p style="margin:4px 0"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p style="color:#666;font-size:12px">Powered by Repliexa</p>
    </div>`;
}

function reminderHtml(p: {
  visitorName: string;
  sessionName: string;
  startTime: string;
  meetLink?: string;
}): string {
  const start = new Date(p.startTime);
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a0a;color:#fff;border-radius:12px">
      <h2 style="color:#f59e0b">Reminder: Session in 1 hour ⏰</h2>
      <p>Hi ${p.visitorName || 'there'}, your session <strong>${p.sessionName}</strong> starts at ${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p>
      ${p.meetLink ? `<p><a href="${p.meetLink}" style="color:#06b6d4;font-weight:bold;font-size:16px">Join Google Meet →</a></p>` : ''}
      <p style="color:#666;font-size:12px">Powered by Repliexa</p>
    </div>`;
}

// ─── Public Functions ─────────────────────────────────────────────────────────

export async function sendBookingConfirmationToVisitor(payload: any, userId: string): Promise<void> {
  try {
    const { getConfig } = await import('./db');
    const config = await getConfig(userId);
    const apiKey = getApiKey(config);
    if (!apiKey) return;

    await sendEmail({
      to: payload.visitorEmail || payload.visitor_email,
      subject: `Booking Confirmed: ${payload.sessionTypeName || 'Your Session'}`,
      html: bookingConfirmationHtml({
        visitorName: payload.visitorName || payload.visitor_name || '',
        sessionName: payload.sessionTypeName || 'Session',
        startTime: payload.startTime || payload.start_time,
        endTime: payload.endTime || payload.end_time,
        meetLink: payload.meetLink || payload.meet_link,
        businessName: config?.name || 'Business',
      }),
      apiKey,
    });
  } catch (err) {
    console.error('[email] sendBookingConfirmationToVisitor failed:', err);
  }
}

export async function sendBookingAlertToOwner(payload: any, userId: string): Promise<void> {
  try {
    const { getConfig } = await import('./db');
    const config = await getConfig(userId);
    const apiKey = getApiKey(config);
    if (!apiKey || !config) return;

    // Get owner email from Clerk (use google_client_id as fallback identifier)
    // In production, store owner email in business_configs
    const ownerEmail = config.google_client_id || process.env.ADMIN_EMAIL;
    if (!ownerEmail || !ownerEmail.includes('@')) return;

    await sendEmail({
      to: ownerEmail,
      subject: `New Booking: ${payload.visitorName || 'A visitor'} booked ${payload.sessionTypeName || 'a session'}`,
      html: ownerBookingAlertHtml({
        visitorName: payload.visitorName || payload.visitor_name || 'Anonymous',
        visitorEmail: payload.visitorEmail || payload.visitor_email || '',
        sessionName: payload.sessionTypeName || 'Session',
        startTime: payload.startTime || payload.start_time,
        paymentReference: payload.paymentReference,
      }),
      apiKey,
    });
  } catch (err) {
    console.error('[email] sendBookingAlertToOwner failed:', err);
  }
}

export async function sendPaymentReceipt(payload: any, userId: string): Promise<void> {
  try {
    const { getConfig } = await import('./db');
    const config = await getConfig(userId);
    const apiKey = getApiKey(config);
    if (!apiKey) return;

    await sendEmail({
      to: payload.visitorEmail || payload.email || '',
      subject: 'Payment Receipt',
      html: paymentReceiptHtml({
        visitorEmail: payload.visitorEmail || '',
        productName: payload.productName || 'Product',
        amount: payload.amount || 0,
        currency: payload.currency || config?.currency || 'NGN',
        reference: payload.reference || '',
        businessName: config?.name || 'Business',
      }),
      apiKey,
    });
  } catch (err) {
    console.error('[email] sendPaymentReceipt failed:', err);
  }
}

export async function sendBookingReminder(payload: any, userId: string): Promise<void> {
  try {
    const { getConfig } = await import('./db');
    const config = await getConfig(userId);
    const apiKey = getApiKey(config);
    if (!apiKey) return;

    await sendEmail({
      to: payload.visitor_email,
      subject: `Reminder: Your session starts in 1 hour`,
      html: reminderHtml({
        visitorName: payload.visitor_name || '',
        sessionName: payload.session_name || 'Session',
        startTime: payload.start_time,
        meetLink: payload.meet_link,
      }),
      apiKey,
    });
  } catch (err) {
    console.error('[email] sendBookingReminder failed:', err);
  }
}
