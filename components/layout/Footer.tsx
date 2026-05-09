import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Support", href: "/support" },
  { label: "Twitter", href: "https://twitter.com/lummyhq" },
  { label: "Instagram", href: "https://instagram.com/lummyhq" },
];

/**
 * Site footer — server component.
 */
export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/6 px-6 py-10" role="contentinfo">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
        <div>
          <Logo iconSize="sm" />
          <p className="mt-2 text-xs text-white/30">
            © {year} Lummy Technologies Ltd. All rights reserved.
          </p>
        </div>

        <nav className="flex flex-wrap gap-6" aria-label="Footer navigation">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs text-white/35 transition-colors hover:text-white/70"
              {...(link.href.startsWith("http")
                ? { target: "_blank", rel: "noopener noreferrer" }
                : {})}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
