-- ============================================================================
-- Fix: Remove duplicate product_options rows
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor if seed.sql was executed multiple times.
-- It keeps only the first row for each (product_id, group_name, option_name)
-- combination and deletes the rest, then adds a unique constraint.
-- ============================================================================

-- Step 1: Delete duplicate rows, keeping the one with the smallest id
DELETE FROM public.product_options
WHERE id NOT IN (
    SELECT DISTINCT ON (product_id, group_name, option_name) id
    FROM public.product_options
    ORDER BY product_id, group_name, option_name, sort_order ASC, id ASC
);

-- Step 2: Add unique constraint (skip if already added via migration update)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'product_options_product_id_group_name_option_name_key'
    ) THEN
        ALTER TABLE public.product_options
            ADD CONSTRAINT product_options_product_id_group_name_option_name_key
            UNIQUE (product_id, group_name, option_name);
    END IF;
END $$;

-- Done! Duplicate options have been removed.
