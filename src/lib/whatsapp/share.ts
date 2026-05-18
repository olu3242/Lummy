const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lummy.co"

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
  priceNgn: number,
  handle: string,
  productId?: string,
): string {
  const url = buildStorefrontUrl(handle) + (productId ? `?product=${productId}` : "")
  const price = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(priceNgn)
  return `Hi! 👋 I'm interested in ordering:\n\n*${productName}* — ${price}\n\nProduct link: ${url}\n\nPlease let me know if it's available 🙏`
}

export function buildOrderConfirmationMessage(
  orderNumber: string,
  customerName: string,
  amountNgn: number,
): string {
  const amount = new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(amountNgn / 100)
  return `Hi ${customerName}! 👋\n\nYour order *#${orderNumber}* (${amount}) has been confirmed. Thank you for shopping with us! 🎉\n\nWe'll be in touch shortly with delivery details.`
}

export function buildWhatsAppShareLink(handle: string, storeName: string): string {
  const msg = buildStorefrontShareMessage(storeName, handle)
  return `https://wa.me/?text=${encodeURIComponent(msg)}`
}

export function buildProductWhatsAppLink(
  creatorPhone: string,
  productName: string,
  priceNgn: number,
  handle: string,
  productId?: string,
): string {
  const msg = buildProductOrderMessage(productName, priceNgn, handle, productId)
  return buildWhatsAppLink(creatorPhone, msg)
}
