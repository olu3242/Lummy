import type { Metadata } from "next"
import { Syne, DM_Sans } from "next/font/google"
import { ThemeProvider } from "@/components/providers/theme-provider"
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
  title: "Lummy — Turn Followers Into Customers",
  description:
    "The creator commerce OS for Africa. Build your storefront, sell via WhatsApp, and grow with AI. Post. Chat. Get Paid.",
  keywords: [
    "creator commerce",
    "Africa",
    "Nigeria",
    "WhatsApp commerce",
    "creator economy",
    "online store",
    "sell online",
    "Paystack",
  ],
  openGraph: {
    title: "Lummy — Turn Followers Into Customers",
    description: "The creator commerce OS for Africa. Post. Chat. Get Paid.",
    type: "website",
    locale: "en_NG",
    siteName: "Lummy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lummy — Turn Followers Into Customers",
    description: "The creator commerce OS for Africa. Post. Chat. Get Paid.",
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
