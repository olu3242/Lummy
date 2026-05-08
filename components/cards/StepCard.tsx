import { IconBubble } from "@/components/ui/IconBubble";
import type { Step } from "@/lib/types";

interface StepCardProps {
  step: Step;
}

/**
 * Step item used in the "How it works" section.
 * Server component.
 */
export function StepCard({ step }: StepCardProps) {
  const Icon = step.icon;

  return (
    <article className="flex gap-4 rounded-3xl bg-white/70 p-4 shadow-sm">
      <IconBubble size="md" color="violet" className="flex-shrink-0">
        <Icon size={21} aria-hidden="true" />
      </IconBubble>

      <div>
        <p className="font-display font-black text-zinc-950">
          <span className="mr-2 text-brand-violet">{step.number}</span>
          {step.title}
        </p>
        <p className="mt-1 text-sm leading-6 text-zinc-600">{step.description}</p>
      </div>
    </article>
  );
}
