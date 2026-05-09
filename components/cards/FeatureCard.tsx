import { IconBubble } from "@/components/ui/IconBubble";
import type { Feature } from "@/lib/types";

interface FeatureCardProps {
  feature: Feature;
}

/**
 * Feature card used in the six-column features strip section.
 * Server component — no client-side interactivity needed.
 */
export function FeatureCard({ feature }: FeatureCardProps) {
  const Icon = feature.icon;

  return (
    <article className="group rounded-3xl p-4 transition-all duration-250 hover:bg-violet-50">
      <IconBubble
        size="md"
        color="violet"
        className="shadow-sm shadow-violet-200 transition-transform duration-300 group-hover:scale-105"
      >
        <Icon size={23} aria-hidden="true" />
      </IconBubble>

      <h3 className="mt-5 font-display text-sm font-black text-zinc-950">
        {feature.title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-zinc-600">
        {feature.description}
      </p>
    </article>
  );
}
