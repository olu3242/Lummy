import Image from "next/image";
import { BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PhoneMockup } from "@/components/phone/PhoneMockup";
import { FloatingCard } from "@/components/phone/FloatingCard";
import { PROOF_AVATARS } from "@/lib/data";

/**
 * Hero section — above the fold.
 *
 * Layout: 2-column grid on lg+, stacked on mobile.
 * Phone mockup + floating cards are client components (Framer Motion).
 * All other content is server-rendered.
 */
export function HeroSection() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className={[
        "relative overflow-hidden px-6 pb-0 pt-[88px]",
        "bg-[radial-gradient(circle_at_65%_30%,rgba(124,58,237,0.45),transparent_35%),linear-gradient(135deg,#070414_0%,#100827_45%,#090515_100%)]",
        "text-white",
      ].join(" ")}
    >
      {/* Grid overlay */}
      <div
        className="hero-grid pointer-events-none absolute inset-0 opacity-30"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 py-16 lg:grid-cols-[1fr_1.15fr] lg:py-24">
        {/* ── Left: copy ──────────────────────────────────── */}
        <div>
          <Badge withDot className="mb-8">
            Built for creators in Africa 💜
          </Badge>

          <h1
            id="hero-heading"
            className={[
              "font-display font-black leading-[0.95] tracking-tight",
              "text-[clamp(48px,7vw,84px)]",
            ].join(" ")}
          >
            Turn Followers Into{" "}
            <span className="grad-text">Customers.</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-200">
            Lummy helps creators sell products, services, and digital offers
            directly from social media with beautiful storefronts, WhatsApp
            commerce, and AI-powered growth tools.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button
              variant="primary"
              size="lg"
              onClick={() => (window.location.href = "/signup")}
              className="group"
            >
              Start Selling Free
              <span
                className="transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              >
                →
              </span>
            </Button>

            <Button variant="ghost" size="lg" asChild>
              <a href="#how-it-works" className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20"
                  aria-hidden="true"
                >
                  ▶
                </span>
                Watch how it works
              </a>
            </Button>
          </div>

          {/* Social proof */}
          <div className="mt-10 flex items-center gap-5">
            {/* Avatar stack */}
            <div className="flex -space-x-3" aria-hidden="true">
              {PROOF_AVATARS.map((avatar) => (
                <Image
                  key={avatar.src}
                  src={avatar.src}
                  alt={avatar.alt}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full border-2 border-[#100827] object-cover"
                />
              ))}
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#100827] bg-brand-violet text-xs font-black">
                10K+
              </div>
            </div>
            <p className="max-w-[200px] text-sm leading-6 text-zinc-300">
              Loved by{" "}
              <strong className="text-violet-300">10,000+ creators</strong>{" "}
              across Africa
            </p>
          </div>
        </div>

        {/* ── Right: phone + floating cards ───────────────── */}
        <div className="relative min-h-[640px]">
          <PhoneMockup />

          {/* New Orders card — bottom left */}
          <FloatingCard
            className="left-2 top-40 hidden w-44 lg:block"
            delay={0.3}
            rotate={-6}
          >
            <p className="text-xs font-bold text-zinc-500">New Orders</p>
            <p className="mt-1 font-display text-4xl font-black">219</p>
            <p className="text-xs font-semibold text-emerald-500">
              +18.7% this week
            </p>
            <BarChart3 className="mt-4 text-brand-violet" aria-hidden="true" />
          </FloatingCard>

          {/* Total Sales card — top right */}
          <FloatingCard
            className="right-6 top-7 hidden w-52 lg:block"
            delay={0.2}
            rotate={5}
          >
            <p className="text-xs font-bold text-zinc-500">Total Sales</p>
            <p className="mt-1 font-display text-2xl font-black">₦24,500,000</p>
            <p className="text-xs font-semibold text-emerald-500">
              +32.5% this month
            </p>
            <div className="mt-4 h-10 rounded-xl bg-gradient-to-r from-violet-100 to-fuchsia-100" />
          </FloatingCard>

          {/* WhatsApp chat card — bottom right */}
          <FloatingCard
            className="bottom-24 right-0 hidden w-64 lg:block"
            delay={0.4}
            rotate={-3}
          >
            <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
              <Image
                src={PROOF_AVATARS[0].src}
                alt="Zainab M."
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <div>
                <p className="text-xs font-black">Zainab M.</p>
                <p className="text-[10px] text-emerald-500">Online</p>
              </div>
            </div>
            <div className="mt-3 space-y-2 text-xs">
              <p className="rounded-2xl bg-zinc-100 p-3">
                Hi, I want to order the Glow Bundle.
              </p>
              <p className="ml-auto w-fit rounded-2xl bg-green-100 p-3">
                Sure! How many would you like?
              </p>
            </div>
          </FloatingCard>
        </div>
      </div>
    </section>
  );
}
