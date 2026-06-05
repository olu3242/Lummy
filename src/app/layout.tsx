import type { Metadata } from "next"
import { Syne, DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { BRAND } from "@/config/branding"
import { getRuntimeAppUrl } from "@/lib/runtime-config"
import "./globals.css"

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700", "800"],
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL(getRuntimeAppUrl()),
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description:
    "The creator commerce platform for modern creators. Build your storefront, sell across channels, and grow with trusted commerce tools.",
  icons: {
    icon: BRAND.icon,
    apple: "/apple-icon.png",
    shortcut: "/favicon.ico",
  },
  keywords: [
    "creator commerce",
    "global commerce",
    "WhatsApp commerce",
    "creator economy",
    "online store",
    "sell online",
    "Paystack",
  ],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "The creator commerce platform for modern creators. Launch, sell, and grow online.",
    images: [{ url: BRAND.logo, width: 800, height: 800, alt: BRAND.name }],
    type: "website",
    locale: "en_NG",
    siteName: BRAND.name,
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: "The creator commerce platform for modern creators. Launch, sell, and grow online.",
    images: [BRAND.logo],
    creator: "@lummyhq",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${syne.variable} ${dmSans.variable} font-body min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
