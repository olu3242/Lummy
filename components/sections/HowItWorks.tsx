import Image from "next/image";
import { MessageCircle, Check } from "lucide-react";
import { STEPS, TESTIMONIALS, PROOF_AVATARS } from "@/lib/data";
import { StepCard } from "@/components/cards/StepCard";
import { TestimonialCard } from "@/components/cards/TestimonialCard";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="hiw-heading"
      className="bg-gradient-to-b from-white to-violet-50 px-6 py-16 text-zinc-950"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.4fr_0.8fr]">

        {/* ── Col 1: Steps ─────────────────────────────────── */}
        <div>
          <p className="text-sm font-black uppercase tracking-widest text-brand-violet">
            How it works
          </p>
          <h2
            id="hiw-heading"
            className="mt-3 font-display text-[clamp(28px,3.5vw,44px)] font-black leading-tight tracking-tight"
          >
            From post to profit in 4 simple steps
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {STEPS.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </div>
        </div>

        {/* ── Col 2: Social → Chat → Payment flow ──────────── */}
        <div className="grid items-center gap-6 md:grid-cols-3">
          {/* Social post card */}
          <div className="overflow-hidden rounded-[2rem] bg-zinc-950 p-3 shadow-2xl">
            <Image
              src="https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=600&q=80"
              alt="Creator selling skincare product"
              width={600}
              height={400}
              className="h-[280px] w-full rounded-[1.5rem] object-cover sm:h-[320px]"
            />
            <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-black text-zinc-950">
              <MessageCircle size={16} aria-hidden="true" />
              Order on WhatsApp
            </button>
          </div>

          {/* WhatsApp chat card */}
          <div className="rounded-[2rem] bg-white p-5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Image
                src={PROOF_AVATARS[0].src}
                alt="Creator"
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="font-display font-black text-zinc-950">Zainab M.</span>
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <p className="rounded-2xl bg-zinc-100 p-3 text-zinc-800">
                Hi, I want to order the Glow Bundle.
              </p>
              <p className="ml-auto w-fit rounded-2xl bg-green-100 p-3 text-green-900">
                Sure! How many would you like?
              </p>
              <p className="rounded-2xl bg-zinc-100 p-3 text-zinc-800">
                One please 😊
              </p>
              <p className="ml-auto w-fit rounded-2xl bg-green-100 p-3 text-green-900">
                Great! Your total is ₦25,000.
              </p>
            </div>
            <button className="mt-5 w-full rounded-2xl bg-emerald-500 py-3 font-display font-black text-white">
              Pay Now
            </button>
          </div>

          {/* Payment success card */}
          <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check size={40} aria-hidden="true" />
            </div>
            <h3 className="mt-5 font-display text-xl font-black text-zinc-950">
              Payment Successful
            </h3>
            <p className="mt-1 font-display text-2xl font-black text-zinc-950">
              ₦25,000
            </p>
            <p className="mt-1 text-xs text-zinc-400">Order ID: #LMY38291</p>
            <button className="mt-6 w-full rounded-2xl bg-brand-violet py-3 font-display font-black text-white">
              View Order
            </button>
          </div>
        </div>

        {/* ── Col 3: Testimonials ───────────────────────────── */}
        <div className="rounded-[2rem] bg-white p-6 shadow-xl">
          <p className="text-xs font-black uppercase tracking-widest text-brand-violet">
            Loved by creators
          </p>
          <h3 className="mt-3 font-display text-2xl font-black text-zinc-950">
            Creators building real businesses
          </h3>
          <div className="mt-6 space-y-4">
            {TESTIMONIALS.map((t) => (
              <TestimonialCard key={t.name} testimonial={t} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
