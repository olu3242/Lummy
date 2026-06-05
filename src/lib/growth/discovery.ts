import { createAdminClient } from "@/lib/supabase/server";

export const DISCOVERY_CATEGORIES = [
  "Fashion",
  "Beauty",
  "Food",
  "Digital Products",
  "Coaching",
  "Services",
] as const;

export type DiscoverySort = "trending" | "new" | "top_sellers";

export type DiscoveryStore = {
  handle: string;
  storeName: string;
  bio: string;
  category: string;
  location: string;
  createdAt: string;
  productCount: number;
  orderCount: number;
  revenue: number;
  score: number;
  heroImage: string | null;
  avatarUrl: string | null;
  topProduct: {
    id: string;
    title: string;
    price: number;
    imageUrl: string | null;
  } | null;
};

type DiscoveryInput = {
  query?: string;
  category?: string;
  location?: string;
  sort?: DiscoverySort;
  limit?: number;
};

function normalize(value?: string | null) {
  return String(value ?? "").trim().toLowerCase();
}

function matches(value: string, search: string) {
  return normalize(value).includes(search);
}

function rankStore(store: DiscoveryStore) {
  return store.orderCount * 12 + store.revenue / 5000 + store.productCount * 2;
}

function categoryMatches(storeCategory: string, selectedCategory: string) {
  const category = normalize(storeCategory);
  return category === selectedCategory || category.includes(selectedCategory);
}

export async function getDiscoveryDirectory(input: DiscoveryInput = {}) {
  const supabase = createAdminClient();
  const limit = Math.min(Math.max(input.limit ?? 48, 1), 96);
  const sort = input.sort ?? "trending";
  const query = normalize(input.query);
  const category = normalize(input.category);
  const location = normalize(input.location);

  const storefrontsResult = await supabase
    .from("storefronts")
    .select("id,handle,bio,hero_image,organization_id,created_at,organizations(name,owner_id,country)")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);
  if (storefrontsResult.error) throw storefrontsResult.error;

  const storefronts = (storefrontsResult.data ?? []) as Array<{
    id: string;
    handle: string;
    bio: string | null;
    hero_image: string | null;
    organization_id: string;
    created_at: string;
    organizations: { name?: string | null; owner_id?: string | null; country?: string | null } | Array<{ name?: string | null; owner_id?: string | null; country?: string | null }> | null;
  }>;

  const orgIds = storefronts.map((s) => s.organization_id);
  const ownerIds = storefronts
    .map((s) => Array.isArray(s.organizations) ? s.organizations[0]?.owner_id : s.organizations?.owner_id)
    .filter(Boolean) as string[];

  const [productsResult, ordersResult, profilesResult, creatorProfilesResult] = await Promise.all([
    orgIds.length
      ? supabase
          .from("products")
          .select("id,organization_id,title,price,image_url,status,created_at")
          .in("organization_id", orgIds)
          .eq("status", "active")
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    orgIds.length
      ? supabase
          .from("orders")
          .select("organization_id,amount,status")
          .in("organization_id", orgIds)
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabase
          .from("profiles")
          .select("id,avatar_url")
          .in("id", ownerIds)
      : Promise.resolve({ data: [], error: null }),
    ownerIds.length
      ? supabase
          .from("creator_profiles")
          .select("user_id,niche,location")
          .in("user_id", ownerIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (productsResult.error) throw productsResult.error;
  if (ordersResult.error) throw ordersResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (creatorProfilesResult.error) throw creatorProfilesResult.error;

  const productsByOrg = new Map<string, Array<{ id: string; title: string; price: number; image_url: string | null }>>();
  for (const product of (productsResult.data ?? []) as Array<{ id: string; organization_id: string; title: string; price: number; image_url: string | null }>) {
    const rows = productsByOrg.get(product.organization_id) ?? [];
    rows.push(product);
    productsByOrg.set(product.organization_id, rows);
  }

  const orderStats = new Map<string, { count: number; revenue: number }>();
  for (const order of (ordersResult.data ?? []) as Array<{ organization_id: string; amount: number | string | null; status: string | null }>) {
    const stats = orderStats.get(order.organization_id) ?? { count: 0, revenue: 0 };
    stats.count += 1;
    if (order.status === "paid") stats.revenue += Number(order.amount ?? 0);
    orderStats.set(order.organization_id, stats);
  }

  const avatars = new Map((profilesResult.data ?? []).map((p: { id: string; avatar_url: string | null }) => [p.id, p.avatar_url]));
  const creatorProfiles = new Map((creatorProfilesResult.data ?? []).map((p: { user_id: string; niche: string | null; location: string | null }) => [p.user_id, p]));

  const stores = storefronts.map((storefront) => {
    const org = Array.isArray(storefront.organizations) ? storefront.organizations[0] : storefront.organizations;
    const ownerId = org?.owner_id ?? "";
    const creatorProfile = creatorProfiles.get(ownerId);
    const products = productsByOrg.get(storefront.organization_id) ?? [];
    const stats = orderStats.get(storefront.organization_id) ?? { count: 0, revenue: 0 };
    const store: DiscoveryStore = {
      handle: storefront.handle,
      storeName: org?.name || `${storefront.handle} Store`,
      bio: storefront.bio ?? "",
      category: creatorProfile?.niche || "General",
      location: creatorProfile?.location || org?.country || "Online",
      createdAt: storefront.created_at,
      productCount: products.length,
      orderCount: stats.count,
      revenue: stats.revenue,
      score: 0,
      heroImage: storefront.hero_image,
      avatarUrl: avatars.get(ownerId) ?? null,
      topProduct: products[0]
        ? {
            id: products[0].id,
            title: products[0].title,
            price: Number(products[0].price),
            imageUrl: products[0].image_url,
          }
        : null,
    };
    store.score = rankStore(store);
    return store;
  }).filter((store) => {
    if (category && !categoryMatches(store.category, category)) return false;
    if (location && !matches(store.location, location)) return false;
    if (!query) return true;
    return [
      store.storeName,
      store.handle,
      store.bio,
      store.category,
      store.location,
      store.topProduct?.title ?? "",
    ].some((value) => matches(value, query));
  });

  stores.sort((a, b) => {
    if (sort === "new") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === "top_sellers") return b.orderCount - a.orderCount || b.revenue - a.revenue;
    return b.score - a.score || b.productCount - a.productCount;
  });

  return stores.slice(0, limit);
}
