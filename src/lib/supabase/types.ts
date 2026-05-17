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
          created_at: string;
        };
        Insert: Partial<Database['public']['Tables']['profiles']['Row']> & { id: string; email: string };
        Update: Partial<Database['public']['Tables']['profiles']['Row']>;
      };
      organizations: { Row: { id: string; name: string; slug: string; owner_id: string; plan: string; currency: string; country: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      organization_members: { Row: { id: string; organization_id: string; user_id: string; role: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      storefronts: { Row: { id: string; organization_id: string; handle: string; bio: string | null; theme: Json | null; hero_image: string | null; social_links: Json | null; is_active: boolean; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      products: { Row: { id: string; organization_id: string; title: string; description: string | null; price: number; currency: string; image_url: string | null; status: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      orders: { Row: { id: string; organization_id: string; customer_email: string; status: string; amount: number; currency: string; payment_provider: string; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
      subscriptions: { Row: { id: string; organization_id: string; provider: string; provider_subscription_id: string | null; status: string; current_period_end: string | null; created_at: string }; Insert: Partial<any>; Update: Partial<any> };
    };
  };
};
