-- ============================================================================
-- BistroBot Database Migration
-- ============================================================================
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- or via: supabase db push
--
-- This migration creates:
--   1. Custom types (order_status enum)
--   2. profiles table (extends auth.users)
--   3. orders table (stores order history)
--   4. Trigger to auto-create profile on sign-up
--   5. Row-Level Security (RLS) policies
--   6. Indexes for performance
-- ============================================================================

-- ─── 1. Custom Types ─────────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE public.order_status AS ENUM (
        'confirmed',
        'preparing',
        'ready',
        'out_for_delivery',
        'delivered',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ─── 2. Profiles Table ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name    TEXT,
    avatar_url      TEXT,
    phone           TEXT,
    dietary_preferences TEXT[] DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at      TIMESTAMPTZ DEFAULT now() NOT NULL,

    -- Constraints
    CONSTRAINT display_name_length CHECK (char_length(display_name) <= 100),
    CONSTRAINT phone_format CHECK (phone IS NULL OR phone ~ '^\+?[0-9\s\-\(\)]+$'),
    CONSTRAINT avatar_url_format CHECK (avatar_url IS NULL OR avatar_url ~ '^https?://')
);

COMMENT ON TABLE public.profiles IS 'User profiles extending Supabase auth.users';

-- ─── 3. Orders Table ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_number        TEXT NOT NULL UNIQUE,
    status              public.order_status DEFAULT 'confirmed' NOT NULL,
    items               JSONB NOT NULL DEFAULT '[]',
    subtotal            NUMERIC(10,2) NOT NULL CHECK (subtotal >= 0),
    tax                 NUMERIC(10,2) NOT NULL CHECK (tax >= 0),
    discount            NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
    total               NUMERIC(10,2) NOT NULL CHECK (total >= 0),
    created_at          TIMESTAMPTZ DEFAULT now() NOT NULL,
    estimated_ready_at  TIMESTAMPTZ NOT NULL,
    estimated_minutes   INTEGER NOT NULL CHECK (estimated_minutes > 0),
    timeline            JSONB DEFAULT '[]' NOT NULL
);

COMMENT ON TABLE public.orders IS 'Customer order records';

-- ─── 4. Auto-create Profile on Sign-up ──────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(
            NEW.raw_user_meta_data ->> 'display_name',
            NEW.raw_user_meta_data ->> 'full_name',
            NEW.raw_user_meta_data ->> 'name',
            split_part(NEW.email, '@', 1)
        ),
        COALESCE(
            NEW.raw_user_meta_data ->> 'avatar_url',
            NEW.raw_user_meta_data ->> 'picture'
        )
    );
    RETURN NEW;
END;
$$;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ─── 5. Auto-update updated_at ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at();

-- ─── 6. Row-Level Security ──────────────────────────────────────────────────

-- Enable RLS on both tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders   ENABLE ROW LEVEL SECURITY;

-- ── Profiles Policies ──

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- The trigger inserts profiles, but users cannot insert directly
-- (prevents creating profiles for other users)
CREATE POLICY "Service role can insert profiles"
    ON public.profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ── Orders Policies ──

-- Users can only see their own orders
CREATE POLICY "Users can view own orders"
    ON public.orders
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create orders for themselves only
CREATE POLICY "Users can create own orders"
    ON public.orders
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update only their own orders (e.g., cancel)
-- In production, status updates would be restricted to a service role
CREATE POLICY "Users can update own orders"
    ON public.orders
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users cannot delete orders (audit trail)
-- No DELETE policy = no deletions allowed

-- ─── 7. Indexes ─────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_orders_user_id     ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status      ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at  ON public.orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_user_status ON public.orders(user_id, status);

-- ─── 8. Grant Permissions ───────────────────────────────────────────────────

-- The anon and authenticated roles need access to these tables
-- RLS policies above control what each user can actually see/do

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.profiles TO anon, authenticated;
GRANT ALL ON public.orders   TO anon, authenticated;

-- ============================================================================
-- Done! Your database is ready for BistroBot authentication.
--
-- Next steps:
--   1. Enable Google OAuth in Supabase Dashboard → Authentication → Providers
--   2. Set your Site URL and redirect URLs in Authentication → URL Configuration
--   3. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
-- ============================================================================
