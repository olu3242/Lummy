import type { Metadata, Viewport } from "next";
import "@/app/globals.css";

/* ─── Metadata ─────────────────────────────────────────── */
export const metadata: Metadata = {
  title: {
    default: "Lummy — Turn Followers Into Customers",
    template: "%s | Lummy",
  },
  description:
    "Lummy helps creators sell products, services, and digital offers directly from social media with beautiful storefronts, WhatsApp commerce, and AI-powered growth tools.",
  keywords: [
    "creator commerce",
    "WhatsApp selling",
    "African creators",
    "social selling",
    "creator monetization",
    "Nigeria",
  ],
  authors: [{ name: "Lummy Technologies Ltd." }],
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://lummy.co",
    siteName: "Lummy",
    title: "Lummy — Turn Followers Into Customers",
    description:
      "The Creator Commerce OS for Africa. Post. Chat. Get Paid.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lummy — Turn Followers Into Customers",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lummy — Turn Followers Into Customers",
    description: "The Creator Commerce OS for Africa. Post. Chat. Get Paid.",
    creator: "@lummyhq",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  metadataBase: new URL("https://lummy.co"),
};

export const viewport: Viewport = {
  themeColor: "#070414",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

/* ─── Root Layout ──────────────────────────────────────── */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      {/*
        Fonts loaded via CSS @import in globals.css (Fontshare CDN).
        For production: self-host with next/font/local for best performance.
      */}
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
