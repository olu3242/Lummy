import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, Search, Sparkles, Star, TrendingUp } from "lucide-react";
import { BRAND } from "@/config/branding";
import { DISCOVERY_CATEGORIES, type DiscoverySort, getDiscoveryDirectory } from "@/lib/growth/discovery";

type DiscoverSearchParams = {
  q?: string;
  category?: string;
  location?: string;
  sort?: DiscoverySort;
};

const sortOptions: Array<{ value: DiscoverySort; label: string }> = [
  { value: "trending", label: "Trending" },
  { value: "new", label: "New creators" },
  { value: "top_sellers", label: "Top sellers" },
];

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Discover creator stores — ${BRAND.name}`,
  description: "Find creator storefronts, products, services, and independent businesses selling on Lummy.",
  alternates: { canonical: "https://lummy.co/discover" },
  openGraph: {
    title: `Discover creator stores on ${BRAND.name}`,
    description: "Browse creator storefronts by category, location, trending activity, and new launches.",
    url: "https://lummy.co/discover",
    siteName: BRAND.name,
    type: "website",
  },
};

function buildHref(next: Partial<DiscoverSearchParams>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(next)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `/discover?${query}` : "/discover";
}

function formatCurrency(value: number) {
  return `NGN ${Math.round(value / 100).toLocaleString()}`;
}

export default async function DiscoverPage({ searchParams }: { searchParams: DiscoverSearchParams }) {
  const sort = sortOptions.some((option) => option.value === searchParams.sort) ? searchParams.sort : "trending";
  const stores = await getDiscoveryDirectory({
    query: searchParams.q,
    category: searchParams.category,
    location: searchParams.location,
    sort,
  }).catch(() => []);

  const directorySchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Discover creator stores on ${BRAND.name}`,
    url: "https://lummy.co/discover",
    mainEntity: stores.map((store) => ({
      "@type": "Store",
      name: store.storeName,
      url: `https://lummy.co/${store.handle}`,
      description: store.bio,
      image: store.heroImage ?? store.avatarUrl ?? undefined,
      address: store.location,
    })),
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(directorySchema) }}
      />
      <section className="border-b border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-purple">Discover</p>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Find creator stores worth shopping.</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Browse active storefronts by category, location, new launches, and marketplace momentum.
            </p>
          </div>

          <form action="/discover" className="grid gap-3 rounded-lg border border-border bg-background p-3 md:grid-cols-[1fr_180px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="q"
                defaultValue={searchParams.q ?? ""}
                placeholder="Search stores, products, or categories"
                className="h-11 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm outline-none ring-brand-purple/20 focus:ring-2"
              />
            </label>
            <input
              name="location"
              defaultValue={searchParams.location ?? ""}
              placeholder="Location"
              className="h-11 rounded-md border border-input bg-background px-3 text-sm outline-none ring-brand-purple/20 focus:ring-2"
            />
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
              Search <ArrowRight className="h-4 w-4" />
            </button>
            {searchParams.category ? <input type="hidden" name="category" value={searchParams.category} /> : null}
            {sort ? <input type="hidden" name="sort" value={sort} /> : null}
          </form>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr] lg:px-8">
        <aside className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Sort</p>
            <div className="grid gap-2">
              {sortOptions.map((option) => (
                <Link
                  key={option.value}
                  href={buildHref({ ...searchParams, sort: option.value })}
                  className={`rounded-md border px-3 py-2 text-sm font-medium ${
                    sort === option.value ? "border-brand-purple bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-accent"
                  }`}
                >
                  {option.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Category</p>
            <div className="grid gap-2">
              <Link href={buildHref({ ...searchParams, category: undefined })} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
                All categories
              </Link>
              {DISCOVERY_CATEGORIES.map((category) => (
                <Link
                  key={category}
                  href={buildHref({ ...searchParams, category })}
                  className={`rounded-md border px-3 py-2 text-sm ${
                    searchParams.category === category ? "border-brand-purple bg-brand-purple/10 text-brand-purple" : "border-border hover:bg-accent"
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border p-4">
              <TrendingUp className="mb-2 h-4 w-4 text-brand-green" />
              <p className="text-2xl font-bold">{stores.length}</p>
              <p className="text-xs text-muted-foreground">Discoverable stores</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Sparkles className="mb-2 h-4 w-4 text-brand-purple" />
              <p className="text-2xl font-bold">{stores.filter((store) => store.productCount > 0).length}</p>
              <p className="text-xs text-muted-foreground">Stores with products</p>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Star className="mb-2 h-4 w-4 text-brand-coral" />
              <p className="text-2xl font-bold">{stores.reduce((sum, store) => sum + store.orderCount, 0)}</p>
              <p className="text-xs text-muted-foreground">Marketplace orders</p>
            </div>
          </div>

          {stores.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border p-8 text-center">
              <p className="font-semibold">No creator stores found</p>
              <p className="mt-1 text-sm text-muted-foreground">Try a broader category, location, or product search.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {stores.map((store) => {
                const image = store.heroImage ?? store.topProduct?.imageUrl ?? store.avatarUrl ?? "/placeholder-product.jpg";
                return (
                  <article key={store.handle} className="overflow-hidden rounded-lg border border-border bg-card">
                    <Link href={`/${store.handle}`} className="block">
                      <div className="relative aspect-[16/9] bg-muted">
                        <Image src={image} alt={store.storeName} fill className="object-cover" unoptimized />
                      </div>
                    </Link>
                    <div className="space-y-3 p-4">
                      <div>
                        <Link href={`/${store.handle}`} className="font-display text-xl font-extrabold hover:text-brand-purple">
                          {store.storeName}
                        </Link>
                        <p className="text-sm text-muted-foreground">@{store.handle}</p>
                      </div>
                      {store.bio ? <p className="line-clamp-2 text-sm text-muted-foreground">{store.bio}</p> : null}
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-border px-2.5 py-1">{store.category}</span>
                        <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
                          <MapPin className="h-3 w-3" /> {store.location}
                        </span>
                        <span className="rounded-full border border-border px-2.5 py-1">{store.productCount} products</span>
                      </div>
                      {store.topProduct ? (
                        <Link href={`/${store.handle}/${store.topProduct.id}`} className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2 text-sm hover:bg-muted">
                          <span className="truncate font-medium">{store.topProduct.title}</span>
                          <span className="text-xs text-muted-foreground">{formatCurrency(store.topProduct.price)}</span>
                        </Link>
                      ) : null}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
