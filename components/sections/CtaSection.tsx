"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

/**
 * Final CTA section with email capture form.
 * Client component — manages form state.
 */
export function CtaSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    // In production: call your signup API here
    window.location.href = `/signup?email=${encodeURIComponent(email)}`;
    setSubmitted(true);
  }

  return (
    <section
      id="cta"
      aria-labelledby="cta-heading"
      className="bg-dark-2 px-6 py-16"
    >
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-700 p-8 shadow-[0_20px_80px_rgba(124,58,237,0.3)] md:p-12">
        <div className="grid gap-8 md:grid-cols-[1fr_1fr] md:items-center">
          {/* Copy */}
          <div>
            <h2
              id="cta-heading"
              className="font-display text-[clamp(28px,4vw,46px)] font-black leading-tight tracking-tight text-white"
            >
              Ready to turn your followers into customers?
            </h2>
            <p className="mt-4 text-base text-violet-100">
              Join 10,000+ creators growing their income with Lummy.
            </p>
          </div>

          {/* Form */}
          <div className="rounded-3xl bg-white/15 p-3 backdrop-blur">
            {submitted ? (
              <div className="flex min-h-[60px] items-center justify-center">
                <p className="font-display font-black text-white">
                  🎉 You&apos;re on the list! Check your inbox.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <label htmlFor="cta-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="cta-email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="min-h-[56px] flex-1 rounded-2xl border-0 bg-white px-5 font-semibold text-zinc-950 outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-brand-violet"
                  />
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 rounded-2xl bg-zinc-950 px-7 py-4 font-display font-black text-white transition-colors hover:bg-zinc-800"
                  >
                    Start for Free
                    <ArrowRight size={18} aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}

            {/* Trust signals */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-violet-100">
              <span>✓ Free to start</span>
              <span>✓ No credit card required</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
