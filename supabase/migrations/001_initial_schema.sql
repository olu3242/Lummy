-- ============================================================
-- LUMMY — Initial Database Schema
-- Migration: 001_initial_schema.sql
-- ============================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE creator_type AS ENUM (
  'product_seller',
  'service_creator',
  'digital_seller',
  'influencer',
  'coach'
);

CREATE TYPE product_type AS ENUM (
  'physical',
  'digital',
  'service'
);

CREATE TYPE order_status AS ENUM (
  'pending',
  'confirmed',
  'processing',
  'completed',
  'cancelled',
  'refunded'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'failed',
  'refunded',
  'partial'
);

CREATE TYPE lead_status AS ENUM (
  'new',
  'hot',
  'warm',
  'cold',
  'converted',
  'lost'
);

CREATE TYPE customer_status AS ENUM (
  'active',
  'inactive',
  'vip',
  'blocked'
);

CREATE TYPE post_type AS ENUM (
  'product_launch',
  'before_after',
  'tutorial',
  'promo',
  'countdown',
  'limited_offer',
  'testimonial',
  'affiliate'
);

CREATE TYPE user_role AS ENUM (
  'creator',
  'customer',
  'admin'
);

CREATE TYPE notification_channel AS ENUM (
  'in_app',
  'whatsapp',
  'email'
);

CREATE TYPE campaign_status AS ENUM (
  'draft',
  'active',
  'paused',
  'ended'
);

-- ============================================================
-- RLS HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION auth_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = required_role::user_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- CORE TABLES
-- ============================================================

-- USERS
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'customer',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own" ON users
  FOR SELECT USING (id = auth.uid() OR has_role('admin'));

CREATE POLICY "users_update_own" ON users
  FOR UPDATE USING (id = auth.uid());

-- ============================================================
-- CREATOR PROFILES
-- ============================================================

CREATE TABLE creator_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  bio TEXT,
  creator_type creator_type NOT NULL DEFAULT 'product_seller',
  niche TEXT,
  whatsapp_number TEXT NOT NULL,
  preferred_platform TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  instagram_url TEXT,
  tiktok_url TEXT,
  facebook_url TEXT,
  twitter_url TEXT,
  youtube_url TEXT,
  theme_color TEXT DEFAULT '#6C4EF3',
  theme_preset TEXT DEFAULT 'purple',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  total_sales BIGINT NOT NULL DEFAULT 0,
  total_revenue BIGINT NOT NULL DEFAULT 0, -- stored in kobo
  storefront_views BIGINT NOT NULL DEFAULT 0,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT NOT NULL DEFAULT 'free',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_-]{3,50}$')
);

CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_profiles_handle ON creator_profiles(handle);
CREATE INDEX idx_creator_profiles_featured ON creator_profiles(is_featured) WHERE is_featured = true;
CREATE INDEX idx_creator_profiles_niche ON creator_profiles USING gin(to_tsvector('english', niche));

ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "creators_select_public" ON creator_profiles
  FOR SELECT USING (is_active = true OR user_id = auth.uid() OR has_role('admin'));

CREATE POLICY "creators_insert_own" ON creator_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "creators_update_own" ON creator_profiles
  FOR UPDATE USING (user_id = auth.uid() OR has_role('admin'));

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  product_type product_type NOT NULL DEFAULT 'physical',
  price BIGINT NOT NULL CHECK (price >= 0), -- stored in kobo
  compare_at_price BIGINT,
  currency TEXT NOT NULL DEFAULT 'NGN',
  images JSONB DEFAULT '[]', -- array of image URLs
  stock_quantity INTEGER,
  is_unlimited_stock BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  whatsapp_cta_enabled BOOLEAN NOT NULL DEFAULT true,
  direct_payment_enabled BOOLEAN NOT NULL DEFAULT false,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  total_sales INTEGER NOT NULL DEFAULT 0,
  total_revenue BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_creator ON products(creator_id);
CREATE INDEX idx_products_published ON products(is_published, creator_id);
CREATE INDEX idx_products_type ON products(product_type);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (is_published = true OR creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "products_write_own" ON products
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- SERVICES
-- ============================================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  duration_minutes INTEGER,
  location_type TEXT DEFAULT 'online', -- online, in-person, both
  images JSONB DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  whatsapp_booking BOOLEAN NOT NULL DEFAULT true,
  direct_booking BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_creator ON services(creator_id);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_public" ON services
  FOR SELECT USING (is_published = true OR creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "services_write_own" ON services
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- DIGITAL PRODUCTS
-- ============================================================

CREATE TABLE digital_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price BIGINT NOT NULL CHECK (price >= 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  file_url TEXT, -- Supabase storage URL (private)
  preview_url TEXT,
  file_size_bytes BIGINT,
  file_type TEXT,
  images JSONB DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  download_limit INTEGER, -- null = unlimited
  metadata JSONB DEFAULT '{}',
  total_sales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_digital_products_creator ON digital_products(creator_id);
ALTER TABLE digital_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "digital_products_select_public" ON digital_products
  FOR SELECT USING (is_published = true OR creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "digital_products_write_own" ON digital_products
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- ORDERS
-- ============================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT NOT NULL UNIQUE DEFAULT 'LMY-' || upper(substr(md5(random()::text), 1, 8)),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  item_type product_type NOT NULL,
  item_id UUID NOT NULL,
  item_name TEXT NOT NULL,
  item_price BIGINT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status order_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_creator ON orders(creator_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_creator_access" ON orders
  FOR ALL USING (
    creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid())
    OR has_role('admin')
  );

-- ============================================================
-- TRANSACTIONS
-- ============================================================

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id),
  provider TEXT NOT NULL, -- paystack, flutterwave, manual
  provider_reference TEXT UNIQUE,
  amount BIGINT NOT NULL,
  fee BIGINT NOT NULL DEFAULT 0,
  net_amount BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  status payment_status NOT NULL DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transactions_creator ON transactions(creator_id);
CREATE INDEX idx_transactions_order ON transactions(order_id);
CREATE INDEX idx_transactions_provider_ref ON transactions(provider_reference);
CREATE INDEX idx_transactions_status ON transactions(status);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transactions_creator_access" ON transactions
  FOR SELECT USING (
    creator_id IN (SELECT id FROM creator_profiles WHERE user_id = auth.uid())
    OR has_role('admin')
  );

-- ============================================================
-- CAMPAIGNS
-- ============================================================

CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  platform TEXT, -- instagram, tiktok, facebook, whatsapp
  status campaign_status NOT NULL DEFAULT 'draft',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  total_conversions BIGINT NOT NULL DEFAULT 0,
  total_revenue BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, slug)
);

CREATE INDEX idx_campaigns_creator ON campaigns(creator_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "campaigns_owner_access" ON campaigns
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- POSTS (SELLABLE)
-- ============================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id),
  post_type post_type NOT NULL DEFAULT 'product_launch',
  title TEXT,
  caption TEXT,
  media_urls JSONB DEFAULT '[]',
  is_published BOOLEAN NOT NULL DEFAULT false,
  platform TEXT,
  total_clicks BIGINT NOT NULL DEFAULT 0,
  total_conversions BIGINT NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_posts_creator ON posts(creator_id);
CREATE INDEX idx_posts_campaign ON posts(campaign_id);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "posts_owner_access" ON posts
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- POST CTAs
-- ============================================================

CREATE TABLE post_ctas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  cta_type TEXT NOT NULL, -- whatsapp, checkout, link, waitlist
  url TEXT NOT NULL,
  item_id UUID, -- optional link to product/service
  item_type product_type,
  click_count BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_ctas_post ON post_ctas(post_id);
ALTER TABLE post_ctas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_ctas_public_select" ON post_ctas FOR SELECT USING (true);
CREATE POLICY "post_ctas_owner_write" ON post_ctas
  FOR ALL USING (post_id IN (
    SELECT p.id FROM posts p
    JOIN creator_profiles cp ON cp.id = p.creator_id
    WHERE cp.user_id = auth.uid()
  ));

-- ============================================================
-- WHATSAPP EVENTS
-- ============================================================

CREATE TABLE whatsapp_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id),
  campaign_id UUID REFERENCES campaigns(id),
  item_id UUID,
  item_type TEXT,
  event_type TEXT NOT NULL DEFAULT 'click', -- click, conversation, conversion
  platform TEXT,
  user_agent TEXT,
  ip_address INET,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_whatsapp_events_creator ON whatsapp_events(creator_id);
CREATE INDEX idx_whatsapp_events_created ON whatsapp_events(created_at DESC);
CREATE INDEX idx_whatsapp_events_campaign ON whatsapp_events(campaign_id);

ALTER TABLE whatsapp_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_events_creator_access" ON whatsapp_events
  FOR SELECT USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "whatsapp_events_insert_public" ON whatsapp_events
  FOR INSERT WITH CHECK (true); -- allow tracking without auth

-- ============================================================
-- LEADS (CRM)
-- ============================================================

CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram_handle TEXT,
  status lead_status NOT NULL DEFAULT 'new',
  source TEXT, -- whatsapp, instagram, tiktok, storefront, manual
  interested_in TEXT[],
  tags TEXT[],
  notes TEXT,
  follow_up_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  converted_to_customer UUID,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_leads_creator ON leads(creator_id);
CREATE INDEX idx_leads_status ON leads(status, creator_id);
CREATE INDEX idx_leads_follow_up ON leads(follow_up_at) WHERE follow_up_at IS NOT NULL;

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_owner_access" ON leads
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- CUSTOMERS (CRM)
-- ============================================================

CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  instagram_handle TEXT,
  status customer_status NOT NULL DEFAULT 'active',
  tags TEXT[],
  notes TEXT,
  total_orders INTEGER NOT NULL DEFAULT 0,
  total_spent BIGINT NOT NULL DEFAULT 0, -- in kobo
  last_order_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_creator ON customers(creator_id);
CREATE INDEX idx_customers_status ON customers(status, creator_id);
CREATE INDEX idx_customers_spent ON customers(total_spent DESC);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_owner_access" ON customers
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- TESTIMONIALS
-- ============================================================

CREATE TABLE testimonials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_avatar_url TEXT,
  content TEXT NOT NULL,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  is_published BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_testimonials_creator ON testimonials(creator_id, is_published);

ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials_public_select" ON testimonials
  FOR SELECT USING (is_published = true OR creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

CREATE POLICY "testimonials_owner_write" ON testimonials
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- AI GENERATIONS
-- ============================================================

CREATE TABLE ai_generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  generation_type TEXT NOT NULL, -- caption, cta, reply, pricing, campaign
  prompt_input JSONB NOT NULL,
  output TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER,
  was_used BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ai_generations_creator ON ai_generations(creator_id);
CREATE INDEX idx_ai_generations_type ON ai_generations(generation_type);
CREATE INDEX idx_ai_generations_created ON ai_generations(created_at DESC);

ALTER TABLE ai_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_gen_owner_access" ON ai_generations
  FOR ALL USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ));

-- ============================================================
-- CREATOR METRICS (DAILY ROLLUP)
-- ============================================================

CREATE TABLE creator_metrics_daily (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES creator_profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  storefront_views INTEGER NOT NULL DEFAULT 0,
  whatsapp_clicks INTEGER NOT NULL DEFAULT 0,
  whatsapp_conversations INTEGER NOT NULL DEFAULT 0,
  orders_created INTEGER NOT NULL DEFAULT 0,
  orders_completed INTEGER NOT NULL DEFAULT 0,
  revenue_ngn BIGINT NOT NULL DEFAULT 0,
  new_leads INTEGER NOT NULL DEFAULT 0,
  new_customers INTEGER NOT NULL DEFAULT 0,
  ai_generations_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(creator_id, date)
);

CREATE INDEX idx_metrics_creator_date ON creator_metrics_daily(creator_id, date DESC);

ALTER TABLE creator_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "metrics_owner_access" ON creator_metrics_daily
  FOR SELECT USING (creator_id IN (
    SELECT id FROM creator_profiles WHERE user_id = auth.uid()
  ) OR has_role('admin'));

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  channel notification_channel NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  action_url TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_own" ON notifications
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_creators BEFORE UPDATE ON creator_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_services BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_digital BEFORE UPDATE ON digital_products FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_transactions BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_campaigns BEFORE UPDATE ON campaigns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_leads BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TRIGGER: Auto-create user profile on auth signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- END OF SCHEMA
-- ============================================================
