import Image from "next/image";
import { Star } from "lucide-react";
import type { Testimonial } from "@/lib/types";

interface TestimonialCardProps {
  testimonial: Testimonial;
}

/**
 * Testimonial card with star rating and author avatar.
 * Server component.
 */
export function TestimonialCard({ testimonial }: TestimonialCardProps) {
  return (
    <article className="rounded-3xl bg-violet-50 p-4">
      {/* Author */}
      <div className="flex items-center gap-3">
        <Image
          src={testimonial.avatarUrl}
          alt={testimonial.name}
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover"
        />
        <div>
          <p className="font-display text-sm font-black text-zinc-950">
            {testimonial.name}
          </p>
          <p className="text-xs text-zinc-500">{testimonial.role}</p>
        </div>

        {/* Stars */}
        <div
          className="ml-auto flex gap-0.5 text-amber-400"
          aria-label={`${testimonial.rating} out of 5 stars`}
        >
          {Array.from({ length: testimonial.rating }).map((_, i) => (
            <Star key={i} size={12} fill="currentColor" aria-hidden="true" />
          ))}
        </div>
      </div>

      {/* Quote */}
      <blockquote className="mt-3 text-sm leading-6 text-zinc-600">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
    </article>
  );
}
