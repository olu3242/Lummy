/**
 * Lummy Email Runtime — powered by Resend
 *
 * P0 gap: RESEND_API_KEY is configured but no transactional emails are sent.
 * This implements the missing email layer: receipts, welcome, notifications.
 */

import { logger } from "@/lib/observability/logger"

const RESEND_API_URL = "https://api.resend.com/emails"
const FROM_ADDRESS = "Lummy <noreply@lummy.co>"
const REPLY_TO = "support@lummy.co"

function getResendKey(): string {
  const key = process.env.RESEND_API_KEY
  if (!key) throw new Error("RESEND_API_KEY not configured")
  return key
}

// ── Types ──────────────────────────────────────────────────────

export interface EmailResult {
  success: boolean
  emailId?: string
  error?: string
  to: string
}

export interface RawEmailPayload {
  to: string | string[]
  subject: string
  html: string
  text?: string
  replyTo?: string
  cc?: string[]
  bcc?: string[]
}

// ── Core send function ─────────────────────────────────────────

export async function sendEmail(payload: RawEmailPayload): Promise<EmailResult> {
  const to = Array.isArray(payload.to) ? payload.to[0]! : payload.to

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${getResendKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:     FROM_ADDRESS,
        to:       Array.isArray(payload.to) ? payload.to : [payload.to],
        subject:  payload.subject,
        html:     payload.html,
        text:     payload.text,
        reply_to: payload.replyTo ?? REPLY_TO,
        cc:       payload.cc,
        bcc:      payload.bcc,
      }),
    })

    const data = await res.json() as { id?: string; message?: string; name?: string }

    if (!res.ok) {
      const errMsg = data.message ?? `HTTP ${res.status}`
      logger.error("[email] Resend error", { to, error: errMsg, status: res.status })
      return { success: false, error: errMsg, to }
    }

    logger.info("[email] sent", { to, emailId: data.id, subject: payload.subject })
    return { success: true, emailId: data.id, to }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err)
    logger.error("[email] network error", { to, error: errMsg })
    return { success: false, error: errMsg, to }
  }
}

// ── HTML template helpers ──────────────────────────────────────

function wrapInLayout(content: string, preheader = ""): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Lummy</title>
<style>
  body{margin:0;padding:0;background:#f8f7ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#111}
  .wrapper{max-width:580px;margin:0 auto;padding:24px 16px}
  .card{background:#fff;border-radius:16px;padding:32px;border:1px solid #e8e4ff}
  .brand{color:#6C4EF3;font-weight:800;font-size:22px;margin-bottom:24px;display:block}
  .divider{border:none;border-top:1px solid #f0edff;margin:24px 0}
  .btn{display:inline-block;background:#6C4EF3;color:#fff!important;padding:12px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;margin:16px 0}
  .muted{color:#888;font-size:13px}
  .amount{font-size:28px;font-weight:800;color:#6C4EF3}
  .label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#aaa;margin-bottom:4px}
  .value{font-size:15px;font-weight:600;margin-bottom:16px}
  .footer{text-align:center;margin-top:24px;color:#aaa;font-size:12px}
  .badge{display:inline-block;background:#f0edff;color:#6C4EF3;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700}
</style>
</head>
<body>
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${preheader}</div>` : ""}
<div class="wrapper">
  <div class="card">
    <span class="brand">🛍️ Lummy</span>
    ${content}
  </div>
  <div class="footer">
    <p>Lummy — Creator Commerce OS for Africa</p>
    <p><a href="https://lummy.co" style="color:#6C4EF3">lummy.co</a></p>
  </div>
</div>
</body>
</html>`
}

// ── Transactional email templates ─────────────────────────────

/** Send order receipt to customer after successful payment */
export async function sendOrderReceipt(opts: {
  to: string
  customerName: string
  orderReference: string
  productName: string
  amountFormatted: string
  storeName: string
  storeHandle: string
  creatorWhatsApp?: string
}): Promise<EmailResult> {
  const storeUrl = `https://lummy.co/${opts.storeHandle}`
  const whatsAppUrl = opts.creatorWhatsApp
    ? `https://wa.me/${opts.creatorWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(`Hi! I just ordered ${opts.productName} (Ref: ${opts.orderReference}). When can I expect delivery?`)}`
    : null

  const html = wrapInLayout(`
    <div class="badge">✅ Payment Confirmed</div>
    <h1 style="font-size:22px;font-weight:800;margin:16px 0 8px">Order Receipt</h1>
    <p style="color:#555;margin-bottom:24px">Hi ${opts.customerName}! Your payment was received. Here are your order details:</p>

    <hr class="divider">

    <p class="label">Order Reference</p>
    <p class="value">${opts.orderReference}</p>

    <p class="label">Product</p>
    <p class="value">${opts.productName}</p>

    <p class="label">Amount Paid</p>
    <p class="amount">${opts.amountFormatted}</p>

    <p class="label">Store</p>
    <p class="value"><a href="${storeUrl}" style="color:#6C4EF3">${opts.storeName}</a></p>

    <hr class="divider">

    <p style="color:#555;font-size:14px">The seller will reach out to confirm delivery details shortly.</p>

    ${whatsAppUrl ? `<a href="${whatsAppUrl}" class="btn">💬 Message Seller on WhatsApp</a>` : ""}

    <p class="muted" style="margin-top:24px">Keep this email for your records. Reference: ${opts.orderReference}</p>
  `, `Payment confirmed for ${opts.productName}`)

  return sendEmail({
    to: opts.to,
    subject: `✅ Order Confirmed — ${opts.productName} | Ref: ${opts.orderReference}`,
    html,
    text: `Order Confirmed!\n\nHi ${opts.customerName},\nYour payment for ${opts.productName} (${opts.amountFormatted}) was received.\n\nOrder Reference: ${opts.orderReference}\n\nThe seller will be in touch about delivery.\n\n— Lummy`,
  })
}

/** Send welcome email to new creator after onboarding */
export async function sendCreatorWelcomeEmail(opts: {
  to: string
  creatorName: string
  storeHandle: string
  storeName: string
}): Promise<EmailResult> {
  const storeUrl = `https://lummy.co/${opts.storeHandle}`
  const dashboardUrl = "https://lummy.co/dashboard"

  const html = wrapInLayout(`
    <h1 style="font-size:24px;font-weight:800;margin:0 0 8px">Welcome to Lummy! 🎉</h1>
    <p style="color:#555;margin-bottom:24px">Hi ${opts.creatorName}! Your creator store is now live and ready to start selling.</p>

    <div style="background:#f8f7ff;border-radius:12px;padding:20px;margin:24px 0">
      <p class="label">Your Store URL</p>
      <a href="${storeUrl}" style="font-size:18px;font-weight:800;color:#6C4EF3;text-decoration:none">${storeUrl}</a>
    </div>

    <p style="font-weight:700;margin:24px 0 12px">Your first steps 👇</p>
    <p style="margin:8px 0">1️⃣ Add your products to your store</p>
    <p style="margin:8px 0">2️⃣ Share your store link on Instagram & WhatsApp</p>
    <p style="margin:8px 0">3️⃣ Enable WhatsApp orders for faster sales</p>

    <a href="${dashboardUrl}" class="btn">Go to Dashboard →</a>

    <hr class="divider">
    <p class="muted">Questions? Reply to this email — we're here to help you succeed. 💜</p>
  `, `Your Lummy store is live at lummy.co/${opts.storeHandle}`)

  return sendEmail({
    to: opts.to,
    subject: `🎉 Welcome to Lummy, ${opts.creatorName}! Your store is live.`,
    html,
    text: `Welcome to Lummy!\n\nHi ${opts.creatorName},\n\nYour store is live at: ${storeUrl}\n\nNext steps:\n1. Add products\n2. Share your link\n3. Enable WhatsApp orders\n\nGo to dashboard: ${dashboardUrl}\n\n— The Lummy Team`,
  })
}

/** Notify creator of a new order */
export async function sendCreatorOrderNotification(opts: {
  to: string
  creatorName: string
  customerName: string
  productName: string
  amountFormatted: string
  orderReference: string
  ordersUrl?: string
}): Promise<EmailResult> {
  const ordersUrl = opts.ordersUrl ?? "https://lummy.co/dashboard/orders"

  const html = wrapInLayout(`
    <div class="badge">🛍️ New Order</div>
    <h1 style="font-size:22px;font-weight:800;margin:16px 0 8px">You have a new order!</h1>
    <p style="color:#555;margin-bottom:24px">Hi ${opts.creatorName}! A customer just placed an order on your store.</p>

    <hr class="divider">

    <p class="label">Customer</p>
    <p class="value">${opts.customerName}</p>

    <p class="label">Product</p>
    <p class="value">${opts.productName}</p>

    <p class="label">Amount</p>
    <p class="amount">${opts.amountFormatted}</p>

    <p class="label">Reference</p>
    <p class="value">${opts.orderReference}</p>

    <hr class="divider">

    <a href="${ordersUrl}" class="btn">View Order →</a>

    <p class="muted">Reply to the customer quickly to confirm delivery details and build trust.</p>
  `, `New order: ${opts.productName} — ${opts.amountFormatted}`)

  return sendEmail({
    to: opts.to,
    subject: `🛍️ New Order — ${opts.productName} (${opts.amountFormatted})`,
    html,
    text: `New Order!\n\nHi ${opts.creatorName},\n\nCustomer: ${opts.customerName}\nProduct: ${opts.productName}\nAmount: ${opts.amountFormatted}\nRef: ${opts.orderReference}\n\nView order: ${ordersUrl}\n\n— Lummy`,
  })
}

/** Weekly performance digest to creator */
export async function sendWeeklyDigest(opts: {
  to: string
  creatorName: string
  weekRevenue: string
  orderCount: number
  topProduct: string
  storeViews: number
  dashboardUrl?: string
}): Promise<EmailResult> {
  const url = opts.dashboardUrl ?? "https://lummy.co/dashboard/analytics"

  const html = wrapInLayout(`
    <h1 style="font-size:22px;font-weight:800;margin:0 0 8px">Your weekly report 📊</h1>
    <p style="color:#555;margin-bottom:24px">Hi ${opts.creatorName}! Here's how your store performed this week.</p>

    <div style="display:grid;gap:16px">
      <div style="background:#f8f7ff;border-radius:12px;padding:20px">
        <p class="label">Revenue</p>
        <p class="amount">${opts.weekRevenue}</p>
      </div>
      <div style="background:#f0fff4;border-radius:12px;padding:20px">
        <p class="label">Orders</p>
        <p style="font-size:28px;font-weight:800;color:#10B981;margin:0">${opts.orderCount}</p>
      </div>
      <div style="background:#fff7ed;border-radius:12px;padding:20px">
        <p class="label">Store Views</p>
        <p style="font-size:28px;font-weight:800;color:#F97316;margin:0">${opts.storeViews}</p>
      </div>
    </div>

    <p style="margin:24px 0 8px"><strong>Top performing product:</strong></p>
    <p style="color:#6C4EF3;font-weight:700">${opts.topProduct}</p>

    <a href="${url}" class="btn">View Full Report →</a>
  `, `Your weekly Lummy report is ready`)

  return sendEmail({
    to: opts.to,
    subject: `📊 Your weekly Lummy report — ${opts.weekRevenue} earned`,
    html,
    text: `Weekly Report\n\nHi ${opts.creatorName},\n\nRevenue: ${opts.weekRevenue}\nOrders: ${opts.orderCount}\nStore Views: ${opts.storeViews}\nTop Product: ${opts.topProduct}\n\nView full report: ${url}\n\n— Lummy`,
  })
}
