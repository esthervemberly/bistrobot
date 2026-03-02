-- ============================================================================
-- BistroBot Products & Menu Migration
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER 001_auth_schema.sql
--
-- This migration creates:
--   1. categories table
--   2. products table
--   3. product_options table
--   4. promo_codes table
--   5. product_embeddings table (pgvector — optional)
--   6. RLS policies (public read for menu data)
--   7. Indexes
-- ============================================================================

-- ─── 1. Categories ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    icon        TEXT,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.categories IS 'Menu categories (Burgers, Pizza, etc.)';

-- ─── 2. Products ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name            TEXT NOT NULL,
    description     TEXT,
    price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    image_url       TEXT,
    tags            TEXT[] DEFAULT '{}',
    allergens       TEXT[] DEFAULT '{}',
    dietary         TEXT[] DEFAULT '{}',
    is_available    BOOLEAN DEFAULT true,
    calories        INTEGER,
    prep_time_min   INTEGER DEFAULT 15,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE public.products IS 'Menu products / food items';

-- ─── 3. Product Options ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.product_options (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id      UUID REFERENCES public.products(id) ON DELETE CASCADE,
    group_name      TEXT NOT NULL,
    option_name     TEXT NOT NULL,
    price_modifier  NUMERIC(10,2) DEFAULT 0,
    is_default      BOOLEAN DEFAULT false,
    sort_order      INTEGER DEFAULT 0,
    UNIQUE (product_id, group_name, option_name)
);

COMMENT ON TABLE public.product_options IS 'Customization options for products (size, sauce, etc.)';

-- ─── 4. Promo Codes ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.promo_codes (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code            TEXT NOT NULL UNIQUE,
    discount_type   TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value  NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
    min_order       NUMERIC(10,2) DEFAULT 0,
    max_uses        INTEGER,
    current_uses    INTEGER DEFAULT 0,
    valid_from      TIMESTAMPTZ DEFAULT now(),
    valid_until     TIMESTAMPTZ,
    is_active       BOOLEAN DEFAULT true
);

COMMENT ON TABLE public.promo_codes IS 'Promotional discount codes';

-- ─── 5. Product Embeddings (pgvector) ────────────────────────────────────────
-- NOTE: Requires the pgvector extension. If not available, skip this section.
-- Enable via Supabase Dashboard → Database → Extensions → vector

-- Uncomment the following block if pgvector is enabled:
--
-- CREATE EXTENSION IF NOT EXISTS vector;
--
-- CREATE TABLE IF NOT EXISTS public.product_embeddings (
--     id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--     product_id   UUID REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
--     embedding    vector(768) NOT NULL,
--     content_hash TEXT NOT NULL,
--     created_at   TIMESTAMPTZ DEFAULT now()
-- );
--
-- CREATE INDEX IF NOT EXISTS idx_product_embeddings_vector
--     ON public.product_embeddings
--     USING ivfflat (embedding vector_cosine_ops)
--     WITH (lists = 100);
--
-- COMMENT ON TABLE public.product_embeddings IS 'Semantic embedding vectors for product search (pgvector)';

-- ─── 6. Auto-update updated_at on products ──────────────────────────────────

-- Reuse the update_updated_at() function from 001_auth_schema.sql
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ─── 7. Row-Level Security ──────────────────────────────────────────────────

ALTER TABLE public.categories      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes     ENABLE ROW LEVEL SECURITY;

-- Public read access for menu data (anyone can browse the menu)
CREATE POLICY "Public read categories"
    ON public.categories FOR SELECT
    USING (true);

CREATE POLICY "Public read available products"
    ON public.products FOR SELECT
    USING (is_available = true);

CREATE POLICY "Public read product options"
    ON public.product_options FOR SELECT
    USING (true);

CREATE POLICY "Public read active promo codes"
    ON public.promo_codes FOR SELECT
    USING (is_active = true);

-- ─── 8. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_category     ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_available    ON public.products(is_available);
CREATE INDEX IF NOT EXISTS idx_product_options_product ON public.product_options(product_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code      ON public.promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_categories_slug       ON public.categories(slug);

-- ─── 9. Grant Permissions ───────────────────────────────────────────────────

GRANT SELECT ON public.categories      TO anon, authenticated;
GRANT SELECT ON public.products        TO anon, authenticated;
GRANT SELECT ON public.product_options TO anon, authenticated;
GRANT SELECT ON public.promo_codes     TO anon, authenticated;

-- ============================================================================
-- Done! Run seed.sql next to populate the tables with menu data.
-- ============================================================================
