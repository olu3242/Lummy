// Supabase Database types — manually authored to match 001_initial_schema.sql
// Regenerate with: npx supabase gen types typescript --local > src/lib/supabase/types.ts
// once a Supabase project is connected.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: "creator" | "customer" | "admin"
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: "creator" | "customer" | "admin"
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: "creator" | "customer" | "admin"
          is_verified?: boolean
          updated_at?: string
        }
      }
      creator_profiles: {
        Row: {
          id: string
          user_id: string
          handle: string
          business_name: string
          bio: string | null
          avatar_url: string | null
          cover_url: string | null
          theme_color: string | null
          theme_preset: string | null
          subscription_tier: "free" | "pro" | "enterprise"
          whatsapp_number: string | null
          instagram_handle: string | null
          tiktok_handle: string | null
          facebook_url: string | null
          twitter_handle: string | null
          youtube_url: string | null
          location: string | null
          niche: string | null
          is_published: boolean
          total_sales: number
          total_revenue: number
          store_schema: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          handle: string
          business_name: string
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          theme_color?: string | null
          theme_preset?: string | null
          subscription_tier?: "free" | "pro" | "enterprise"
          whatsapp_number?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          facebook_url?: string | null
          twitter_handle?: string | null
          youtube_url?: string | null
          location?: string | null
          niche?: string | null
          is_published?: boolean
          total_sales?: number
          total_revenue?: number
          store_schema?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          handle?: string
          business_name?: string
          bio?: string | null
          avatar_url?: string | null
          cover_url?: string | null
          theme_color?: string | null
          theme_preset?: string | null
          subscription_tier?: "free" | "pro" | "enterprise"
          whatsapp_number?: string | null
          instagram_handle?: string | null
          tiktok_handle?: string | null
          facebook_url?: string | null
          twitter_handle?: string | null
          youtube_url?: string | null
          location?: string | null
          niche?: string | null
          is_published?: boolean
          total_sales?: number
          total_revenue?: number
          store_schema?: Json | null
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          creator_id: string
          name: string
          description: string | null
          price: number
          compare_at_price: number | null
          currency: string
          type: "physical" | "digital" | "service"
          images: Json
          stock_quantity: number | null
          is_unlimited_stock: boolean
          is_published: boolean
          is_featured: boolean
          category: string | null
          tags: string[] | null
          whatsapp_enabled: boolean
          total_sales: number
          total_revenue: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          name: string
          description?: string | null
          price: number
          compare_at_price?: number | null
          currency?: string
          type?: "physical" | "digital" | "service"
          images?: Json
          stock_quantity?: number | null
          is_unlimited_stock?: boolean
          is_published?: boolean
          is_featured?: boolean
          category?: string | null
          tags?: string[] | null
          whatsapp_enabled?: boolean
          total_sales?: number
          total_revenue?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          compare_at_price?: number | null
          currency?: string
          type?: "physical" | "digital" | "service"
          images?: Json
          stock_quantity?: number | null
          is_unlimited_stock?: boolean
          is_published?: boolean
          is_featured?: boolean
          category?: string | null
          tags?: string[] | null
          whatsapp_enabled?: boolean
          total_sales?: number
          total_revenue?: number
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          creator_id: string
          customer_id: string | null
          order_number: string
          status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
          payment_status: "pending" | "paid" | "failed" | "refunded"
          total_amount: number
          currency: string
          notes: string | null
          shipping_address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          customer_id?: string | null
          order_number?: string
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
          payment_status?: "pending" | "paid" | "failed" | "refunded"
          total_amount: number
          currency?: string
          notes?: string | null
          shipping_address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"
          payment_status?: "pending" | "paid" | "failed" | "refunded"
          total_amount?: number
          currency?: string
          notes?: string | null
          shipping_address?: Json | null
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          order_id: string | null
          creator_id: string
          provider: "paystack" | "flutterwave" | "manual"
          provider_reference: string | null
          amount: number
          fee: number | null
          net_amount: number | null
          currency: string
          status: "pending" | "paid" | "failed" | "refunded"
          metadata: Json | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          creator_id: string
          provider?: "paystack" | "flutterwave" | "manual"
          provider_reference?: string | null
          amount: number
          fee?: number | null
          net_amount?: number | null
          currency?: string
          status?: "pending" | "paid" | "failed" | "refunded"
          metadata?: Json | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: "pending" | "paid" | "failed" | "refunded"
          provider_reference?: string | null
          fee?: number | null
          net_amount?: number | null
          metadata?: Json | null
          paid_at?: string | null
          updated_at?: string
        }
      }
      whatsapp_events: {
        Row: {
          id: string
          creator_id: string
          product_id: string | null
          event_type: "click" | "conversation" | "conversion"
          platform: string | null
          campaign_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          creator_id: string
          product_id?: string | null
          event_type: "click" | "conversation" | "conversion"
          platform?: string | null
          campaign_id?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

// Convenience row types
export type UserRow = Database["public"]["Tables"]["users"]["Row"]
export type CreatorProfileRow = Database["public"]["Tables"]["creator_profiles"]["Row"]
export type ProductRow = Database["public"]["Tables"]["products"]["Row"]
export type OrderRow = Database["public"]["Tables"]["orders"]["Row"]
export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"]
