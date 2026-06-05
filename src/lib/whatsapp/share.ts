const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lummy.co"

function formatAmount(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount)
}

export function buildStorefrontUrl(handle: string): string {
  return `${APP_URL}/${handle}`
}

export function buildWhatsAppLink(phone: string, message: string): string {
  // Normalize phone: ensure E.164-ish, strip spaces/dashes
  const normalized = phone.replace(/[\s\-()]/g, "").replace(/^\+/, "")
  const encoded = encodeURIComponent(message)
  return `https://wa.me/${normalized}?text=${encoded}`
}

export function buildStorefrontShareMessage(storeName: string, handle: string): string {
  const url = buildStorefrontUrl(handle)
  return `Hey! 👋 Check out ${storeName} on Lummy.\n\nShop here 👉 ${url}\n\nDM me to order! 💜`
}

export function buildProductOrderMessage(
  productName: string,
  price: number,
  handle: string,
  productId?: string,
  currency = "USD",
): string {
  const url = buildStorefrontUrl(handle) + (productId ? `?product=${productId}` : "")
  const formattedPrice = formatAmount(price, currency)
  return `Hi! 👋 I'm interested in ordering:\n\n*${productName}* — ${formattedPrice}\n\nProduct link: ${url}\n\nPlease let me know if it's available 🙏`
}

export function buildOrderConfirmationMessage(
  orderNumber: string,
  customerName: string,
  amount: number,
  currency = "USD",
): string {
  const formattedAmount = formatAmount(amount / 100, currency)
  return `Hi ${customerName}! 👋\n\nYour order *#${orderNumber}* (${formattedAmount}) has been confirmed. Thank you for shopping with us! 🎉\n\nWe'll be in touch shortly with delivery details.`
}

export function buildWhatsAppShareLink(handle: string, storeName: string): string {
  const msg = buildStorefrontShareMessage(storeName, handle)
  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export function buildProductWhatsAppLink(
  creatorPhone: string,
  productName: string,
  price: number,
  handle: string,
  productId?: string,
  currency = "USD",
): string {
  const msg = buildProductOrderMessage(productName, price, handle, productId, currency)
  return buildWhatsAppLink(creatorPhone, msg)
}
