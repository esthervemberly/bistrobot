-- ============================================================================
-- BistroBot Seed Data
-- ============================================================================
-- Run this in Supabase SQL Editor AFTER both migration files.
-- Populates categories, products, product_options, and promo_codes.
-- ============================================================================

-- ─── Categories ─────────────────────────────────────────────────────────────

INSERT INTO public.categories (id, name, slug, icon, sort_order) VALUES
    ('11111111-1111-1111-1111-111111111001', 'Burgers',     'burgers',     '🍔', 1),
    ('11111111-1111-1111-1111-111111111002', 'Pizza',       'pizza',       '🍕', 2),
    ('11111111-1111-1111-1111-111111111003', 'Appetizers',  'appetizers',  '🍟', 3),
    ('11111111-1111-1111-1111-111111111004', 'Drinks',      'drinks',      '🥤', 4),
    ('11111111-1111-1111-1111-111111111005', 'Desserts',    'desserts',    '🍰', 5)
ON CONFLICT (id) DO NOTHING;

-- ─── Products ───────────────────────────────────────────────────────────────

INSERT INTO public.products (id, category_id, name, description, price, image_url, tags, allergens, dietary, is_available, calories, prep_time_min) VALUES

    -- Burgers
    ('22222222-2222-2222-2222-222222222001',
     '11111111-1111-1111-1111-111111111001',
     'Double Beef Burger',
     'Two juicy beef patties with melted cheddar, crispy lettuce, pickles, and our signature smoky sauce on a toasted brioche bun.',
     15.50,
     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
     ARRAY['popular', 'bestseller'],
     ARRAY['gluten', 'dairy'],
     ARRAY[]::text[],
     true, 850, 12),

    ('22222222-2222-2222-2222-222222222002',
     '11111111-1111-1111-1111-111111111001',
     'Chicken Avocado Burger',
     'Grilled chicken breast with fresh avocado, arugula, tomato, and garlic aioli on a whole wheat bun.',
     14.00,
     'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
     ARRAY['healthy'],
     ARRAY['gluten'],
     ARRAY[]::text[],
     true, 620, 10),

    ('22222222-2222-2222-2222-222222222003',
     '11111111-1111-1111-1111-111111111001',
     'Veggie Beyond Burger',
     'Plant-based Beyond patty with vegan cheese, pickled onions, lettuce, and chipotle mayo.',
     13.50,
     'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop',
     ARRAY['plant-based'],
     ARRAY['gluten', 'soy'],
     ARRAY['vegan'],
     true, 540, 10),

    -- Pizza
    ('22222222-2222-2222-2222-222222222004',
     '11111111-1111-1111-1111-111111111002',
     'Pepperoni Feast Pizza',
     'Classic pepperoni loaded on a hand-tossed crust with mozzarella and our house-made marinara sauce.',
     18.00,
     'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
     ARRAY['popular', 'shareable'],
     ARRAY['gluten', 'dairy'],
     ARRAY[]::text[],
     true, 1200, 18),

    ('22222222-2222-2222-2222-222222222005',
     '11111111-1111-1111-1111-111111111002',
     'Margherita Pizza',
     'Fresh mozzarella, San Marzano tomato sauce, and basil on a perfectly charred Neapolitan crust.',
     15.00,
     'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
     ARRAY['classic'],
     ARRAY['gluten', 'dairy'],
     ARRAY['vegetarian'],
     true, 900, 15),

    ('22222222-2222-2222-2222-222222222013',
     '11111111-1111-1111-1111-111111111002',
     'BBQ Chicken Pizza',
     'Smoky BBQ sauce, grilled chicken, red onions, cilantro, and a blend of mozzarella and gouda.',
     19.00,
     'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
     ARRAY['smoky', 'popular'],
     ARRAY['gluten', 'dairy'],
     ARRAY[]::text[],
     true, 1100, 18),

    -- Appetizers
    ('22222222-2222-2222-2222-222222222006',
     '11111111-1111-1111-1111-111111111003',
     'Spicy Chicken Wings',
     'Crispy fried wings tossed in house-made sriracha glaze. Served with celery sticks and blue cheese dip.',
     12.99,
     'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop',
     ARRAY['spicy', 'popular', 'shareable'],
     ARRAY['soy'],
     ARRAY[]::text[],
     true, 650, 12),

    ('22222222-2222-2222-2222-222222222007',
     '11111111-1111-1111-1111-111111111003',
     'Garlic Parmesan Fries',
     'Crispy golden fries tossed with roasted garlic, parmesan cheese, and fresh herbs.',
     7.50,
     'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop',
     ARRAY['shareable'],
     ARRAY['dairy', 'gluten'],
     ARRAY['vegetarian'],
     true, 420, 8),

    ('22222222-2222-2222-2222-222222222008',
     '11111111-1111-1111-1111-111111111003',
     'Mozzarella Sticks',
     'Golden-fried mozzarella sticks served with warm marinara dipping sauce.',
     8.99,
     'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=300&fit=crop',
     ARRAY['classic'],
     ARRAY['gluten', 'dairy'],
     ARRAY['vegetarian'],
     true, 510, 8),

    -- Drinks
    ('22222222-2222-2222-2222-222222222009',
     '11111111-1111-1111-1111-111111111004',
     'Vanilla Milkshake',
     'Thick and creamy vanilla milkshake made with real vanilla bean ice cream and topped with whipped cream.',
     6.50,
     'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
     ARRAY['sweet'],
     ARRAY['dairy'],
     ARRAY['vegetarian'],
     true, 480, 5),

    ('22222222-2222-2222-2222-222222222010',
     '11111111-1111-1111-1111-111111111004',
     'Fresh Lemonade',
     'Freshly squeezed lemonade with a hint of mint. Refreshing and naturally sweetened.',
     4.50,
     'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
     ARRAY['refreshing', 'healthy'],
     ARRAY[]::text[],
     ARRAY['vegan', 'gluten-free'],
     true, 120, 3),

    ('22222222-2222-2222-2222-222222222011',
     '11111111-1111-1111-1111-111111111004',
     'Iced Coffee',
     'Cold brew coffee over ice with your choice of milk. Smooth, bold, and refreshing.',
     5.00,
     'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
     ARRAY['caffeine'],
     ARRAY['dairy'],
     ARRAY[]::text[],
     true, 80, 3),

    -- Desserts
    ('22222222-2222-2222-2222-222222222012',
     '11111111-1111-1111-1111-111111111005',
     'Chocolate Lava Cake',
     'Warm molten chocolate cake with a gooey center, served with vanilla ice cream.',
     9.50,
     'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
     ARRAY['sweet', 'popular'],
     ARRAY['gluten', 'dairy', 'eggs'],
     ARRAY['vegetarian'],
     true, 680, 10)

ON CONFLICT (id) DO NOTHING;

-- ─── Product Options ────────────────────────────────────────────────────────

INSERT INTO public.product_options (product_id, group_name, option_name, price_modifier, is_default, sort_order) VALUES

    -- Double Beef Burger — Size
    ('22222222-2222-2222-2222-222222222001', 'Size', 'Regular', 0, true, 1),
    ('22222222-2222-2222-2222-222222222001', 'Size', 'Large', 3.00, false, 2),
    -- Double Beef Burger — Add-ons
    ('22222222-2222-2222-2222-222222222001', 'Add-ons', 'Extra Cheese', 1.50, false, 1),
    ('22222222-2222-2222-2222-222222222001', 'Add-ons', 'Bacon', 2.00, false, 2),
    ('22222222-2222-2222-2222-222222222001', 'Add-ons', 'Avocado', 2.50, false, 3),

    -- Chicken Avocado Burger — Size
    ('22222222-2222-2222-2222-222222222002', 'Size', 'Regular', 0, true, 1),
    ('22222222-2222-2222-2222-222222222002', 'Size', 'Large', 3.00, false, 2),

    -- Pepperoni Feast Pizza — Size & Crust
    ('22222222-2222-2222-2222-222222222004', 'Size', '10" Small', 0, false, 1),
    ('22222222-2222-2222-2222-222222222004', 'Size', '12" Medium', 3.00, true, 2),
    ('22222222-2222-2222-2222-222222222004', 'Size', '14" Large', 6.00, false, 3),
    ('22222222-2222-2222-2222-222222222004', 'Crust', 'Classic', 0, true, 1),
    ('22222222-2222-2222-2222-222222222004', 'Crust', 'Thin Crust', 0, false, 2),
    ('22222222-2222-2222-2222-222222222004', 'Crust', 'Stuffed Crust', 2.50, false, 3),

    -- Margherita Pizza — Size
    ('22222222-2222-2222-2222-222222222005', 'Size', '10" Small', 0, false, 1),
    ('22222222-2222-2222-2222-222222222005', 'Size', '12" Medium', 3.00, true, 2),
    ('22222222-2222-2222-2222-222222222005', 'Size', '14" Large', 6.00, false, 3),

    -- Spicy Chicken Wings — Pieces & Sauce
    ('22222222-2222-2222-2222-222222222006', 'Pieces', '6 Pieces', 0, true, 1),
    ('22222222-2222-2222-2222-222222222006', 'Pieces', '12 Pieces', 6.00, false, 2),
    ('22222222-2222-2222-2222-222222222006', 'Sauce', 'Sriracha Glaze', 0, true, 1),
    ('22222222-2222-2222-2222-222222222006', 'Sauce', 'Buffalo', 0, false, 2),
    ('22222222-2222-2222-2222-222222222006', 'Sauce', 'Honey BBQ', 0.50, false, 3),

    -- Garlic Parmesan Fries — Size
    ('22222222-2222-2222-2222-222222222007', 'Size', 'Regular', 0, true, 1),
    ('22222222-2222-2222-2222-222222222007', 'Size', 'Large', 3.00, false, 2),

    -- Vanilla Milkshake — Size
    ('22222222-2222-2222-2222-222222222009', 'Size', 'Regular', 0, true, 1),
    ('22222222-2222-2222-2222-222222222009', 'Size', 'Large', 2.00, false, 2),

    -- Iced Coffee — Milk
    ('22222222-2222-2222-2222-222222222011', 'Milk', 'Regular Milk', 0, true, 1),
    ('22222222-2222-2222-2222-222222222011', 'Milk', 'Oat Milk', 0.75, false, 2),
    ('22222222-2222-2222-2222-222222222011', 'Milk', 'Almond Milk', 0.75, false, 3),

    -- BBQ Chicken Pizza — Size
    ('22222222-2222-2222-2222-222222222013', 'Size', '10" Small', 0, false, 1),
    ('22222222-2222-2222-2222-222222222013', 'Size', '12" Medium', 3.00, true, 2),
    ('22222222-2222-2222-2222-222222222013', 'Size', '14" Large', 6.00, false, 3)

ON CONFLICT (product_id, group_name, option_name) DO NOTHING;

-- ─── Promo Codes ────────────────────────────────────────────────────────────

INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order, max_uses, is_active) VALUES
    ('SAVE10',    'percentage', 10, 0,  NULL, true),
    ('WELCOME20', 'percentage', 20, 0,  NULL, true),
    ('BISTRO15',  'percentage', 15, 0,  NULL, true)
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- Done! Your menu data is now in Supabase.
-- ============================================================================
