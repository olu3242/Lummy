import { FEATURES } from "@/lib/data";
import { FeatureCard } from "@/components/cards/FeatureCard";

export function FeaturesStrip() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative z-20 -mt-px rounded-t-[2rem] bg-white px-6 py-12 shadow-2xl"
    >
      <div className="mx-auto max-w-7xl">
        <p className="mb-2 text-center text-xs font-black uppercase tracking-widest text-brand-violet">
          Built for Creators
        </p>
        <h2
          id="features-heading"
          className="mb-10 text-center font-display text-[clamp(22px,3vw,34px)] font-black tracking-tight text-zinc-950"
        >
          Everything you need to sell smarter and grow faster
        </h2>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
