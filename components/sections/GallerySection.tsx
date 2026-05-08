import { GALLERY_ITEMS } from "@/lib/data";
import { GalleryCard } from "@/components/cards/GalleryCard";

export function GallerySection() {
  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="bg-dark px-6 py-16 text-white"
    >
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-widest text-violet-400">
              Creator gallery
            </p>
            <h2
              id="gallery-heading"
              className="mt-3 font-display text-[clamp(28px,4vw,48px)] font-black tracking-tight"
            >
              Built for real sellers,
              <br className="hidden sm:block" /> not generic stores.
            </h2>
          </div>
          <button className="w-fit rounded-2xl border border-white/10 px-5 py-3 text-sm font-bold text-white transition-colors hover:border-white/20 hover:bg-white/5">
            Explore templates →
          </button>
        </div>

        {/* Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {GALLERY_ITEMS.map((item) => (
            <GalleryCard key={item.title} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
