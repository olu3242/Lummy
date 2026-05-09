import Image from "next/image";
import type { GalleryItem } from "@/lib/types";

interface GalleryCardProps {
  item: GalleryItem;
}

/**
 * Gallery card with hover scale image effect.
 * Server component — CSS handles the hover transform.
 */
export function GalleryCard({ item }: GalleryCardProps) {
  return (
    <article className="group overflow-hidden rounded-4xl bg-white/5 border border-white/7 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_24px_70px_rgba(124,58,237,0.2)]">
      <div className="overflow-hidden">
        <Image
          src={item.imageUrl}
          alt={item.imageAlt}
          width={900}
          height={400}
          className="h-[280px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-6">
        <h3 className="font-display text-2xl font-black text-white">
          {item.title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-white/50">{item.description}</p>
      </div>
    </article>
  );
}
