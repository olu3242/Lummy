export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          phone: string | null;
          onboarding_completed: boolean;
          onboarding_step: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      organizations: { Row: { id: string; name: string; slug: string; owner_id: string; plan: string; currency: string; country: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      organization_members: { Row: { id: string; organization_id: string; user_id: string; role: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      storefronts: { Row: { id: string; organization_id: string; handle: string; bio: string | null; theme: Json | null; store_schema: Json | null; hero_image: string | null; social_links: Json | null; is_active: boolean; created_at: string; updated_at: string | null }; Insert: Partial<any>; Update: Partial<any> };
      products: { Row: { id: string; organization_id: string; title: string; description: string | null; price: number; currency: string; image_url: string | null; status: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      orders: { Row: { id: string; organization_id: string; creator_id: string | null; customer_email: string; customer_name: string | null; customer_phone: string | null; customer_address: string | null; status: string; payment_status: string | null; amount: number; currency: string; payment_provider: string; notes: string | null; created_at: string; updated_at: string | null }; Insert: Partial<any>; Update: Partial<any> };
      subscriptions: { Row: { id: string; organization_id: string; provider: string; provider_subscription_id: string | null; status: string; current_period_end: string | null; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
    };
  };
};

export type ProductRow = {
  id: string;
  organization_id: string;
  creator_id: string | null;
  name: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  currency: string;
  images: string[] | null;
  image_url: string | null;
  category: string | null;
  status: string;
  is_published: boolean;
  is_featured: boolean;
  stock_quantity: number | null;
  is_unlimited_stock: boolean;
  total_sales: number;
  whatsapp_enabled: boolean;
  created_at: string;
};

export type OrderRow = {
  id: string;
  organization_id: string;
  creator_id: string | null;
  order_number: string;
  customer_email: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  status: string;
  payment_status: string | null;
  amount: number;
  total_amount: number;
  currency: string;
  payment_provider: string;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
};

export type TransactionRow = {
  id: string;
  order_id: string;
  creator_id: string | null;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  provider_reference: string | null;
  created_at: string;
};

export type CreatorProfileRow = {
  id: string;
  user_id: string;
  handle: string;
  business_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  whatsapp_number: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  twitter_handle: string | null;
  location: string | null;
  total_sales: number;
  total_revenue: number;
  store_schema: Json | null;
  created_at: string;
};
