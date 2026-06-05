export const SUPPORTED_CURRENCIES = ["USD", "CAD", "GBP", "EUR", "NGN", "KES", "GHS", "ZAR", "AED", "INR", "AUD"] as const;
export const SUPPORTED_LOCALES = ["en-US", "en-GB", "fr-FR", "fr-CA", "es-ES", "pt-BR", "ar-AE"] as const;

export const COUNTRY_OPTIONS = [
  { code: "US", label: "United States", currency: "USD", locale: "en-US", timezone: "America/New_York" },
  { code: "CA", label: "Canada", currency: "CAD", locale: "en-CA", timezone: "America/Toronto" },
  { code: "GB", label: "United Kingdom", currency: "GBP", locale: "en-GB", timezone: "Europe/London" },
  { code: "AU", label: "Australia", currency: "AUD", locale: "en-GB", timezone: "Australia/Sydney" },
  { code: "AE", label: "United Arab Emirates", currency: "AED", locale: "ar-AE", timezone: "Asia/Dubai" },
  { code: "IN", label: "India", currency: "INR", locale: "en-GB", timezone: "Asia/Kolkata" },
  { code: "NG", label: "Nigeria", currency: "NGN", locale: "en-GB", timezone: "Africa/Lagos" },
  { code: "KE", label: "Kenya", currency: "KES", locale: "en-GB", timezone: "Africa/Nairobi" },
  { code: "GH", label: "Ghana", currency: "GHS", locale: "en-GB", timezone: "Africa/Accra" },
  { code: "ZA", label: "South Africa", currency: "ZAR", locale: "en-GB", timezone: "Africa/Johannesburg" },
] as const;

export type SupportedCurrency = typeof SUPPORTED_CURRENCIES[number];

export function normalizeCurrency(currency?: string | null): SupportedCurrency {
  const value = String(currency ?? "USD").toUpperCase();
  return SUPPORTED_CURRENCIES.includes(value as SupportedCurrency) ? value as SupportedCurrency : "USD";
}

export function formatMoney(amount: number, currency?: string | null, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: normalizeCurrency(currency),
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatMinorMoney(amount: number, currency?: string | null, locale = "en-US") {
  return formatMoney(Math.round(amount / 100), currency, locale);
}
