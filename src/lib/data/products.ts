/**
 * Product & category data module.
 *
 * Exports interfaces, local fallback data, and Supabase-backed
 * fetch functions. Components should use the async fetchers;
 * the local arrays are kept as fallbacks when Supabase is unavailable.
 */

import type { DbCategory, DbProduct, DbProductOption } from '@/lib/supabase/types';

export interface ProductOption {
    group_name: string;
    choices: {
        option_name: string;
        price_modifier: number;
        is_default: boolean;
    }[];
}

export interface Product {
    id: string;
    category_id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    tags: string[];
    allergens: string[];
    dietary: string[];
    is_available: boolean;
    calories: number;
    prep_time_min: number;
    options: ProductOption[];
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    icon: string;
}

/* ─── Supabase availability guard ─── */

function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co'
    );
}

/* ─── In-memory cache ─── */

let cachedProducts: Product[] | null = null;
let cachedCategories: Category[] | null = null;
let fetchPromise: Promise<{ products: Product[]; categories: Category[] }> | null = null;

/* ─── Row → App type converters ─── */

function dbCategoryToCategory(row: DbCategory): Category {
    return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        icon: row.icon || '🍽️',
    };
}

function dbProductToProduct(
    row: DbProduct,
    options: DbProductOption[]
): Product {
    // Group flat option rows into the nested ProductOption[] structure
    // Sort by sort_order first so choices appear in correct order
    const sorted = [...options].sort((a, b) => a.sort_order - b.sort_order);
    const groupMap = new Map<string, ProductOption>();
    const seen = new Set<string>();
    for (const opt of sorted) {
        const dedupeKey = `${opt.group_name}::${opt.option_name}`;
        if (seen.has(dedupeKey)) continue; // skip duplicate rows
        seen.add(dedupeKey);
        if (!groupMap.has(opt.group_name)) {
            groupMap.set(opt.group_name, { group_name: opt.group_name, choices: [] });
        }
        groupMap.get(opt.group_name)!.choices.push({
            option_name: opt.option_name,
            price_modifier: opt.price_modifier,
            is_default: opt.is_default,
        });
    }

    return {
        id: row.id,
        category_id: row.category_id || '',
        name: row.name,
        description: row.description || '',
        price: row.price,
        image_url: row.image_url || '',
        tags: row.tags,
        allergens: row.allergens,
        dietary: row.dietary,
        is_available: row.is_available,
        calories: row.calories || 0,
        prep_time_min: row.prep_time_min,
        options: Array.from(groupMap.values()),
    };
}

/* ─── Supabase fetching ─── */

async function fetchFromSupabase(): Promise<{ products: Product[]; categories: Category[] }> {
    const { getSupabaseBrowser } = await import('@/lib/supabase/client');
    const supabase = getSupabaseBrowser();

    // Fetch categories and products in parallel
    const [catRes, prodRes, optRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('products').select('*').order('name', { ascending: true }),
        supabase.from('product_options').select('*').order('sort_order', { ascending: true }),
    ]);

    if (catRes.error || prodRes.error || optRes.error) {
        console.error('[products] Supabase fetch error:', catRes.error || prodRes.error || optRes.error);
        throw new Error('Failed to fetch menu data from Supabase');
    }

    const dbCategories = (catRes.data || []) as DbCategory[];
    const dbProducts = (prodRes.data || []) as DbProduct[];
    const dbOptions = (optRes.data || []) as DbProductOption[];

    // Group options by product_id for efficient lookup
    const optionsByProduct = new Map<string, DbProductOption[]>();
    for (const opt of dbOptions) {
        if (!opt.product_id) continue;
        if (!optionsByProduct.has(opt.product_id)) {
            optionsByProduct.set(opt.product_id, []);
        }
        optionsByProduct.get(opt.product_id)!.push(opt);
    }

    const fetchedCategories = dbCategories.map(dbCategoryToCategory);
    const fetchedProducts = dbProducts.map(p =>
        dbProductToProduct(p, optionsByProduct.get(p.id) || [])
    );

    return { products: fetchedProducts, categories: fetchedCategories };
}

/**
 * Load products and categories from Supabase (with in-memory cache
 * and local fallback). Returns cached data on subsequent calls.
 */
export async function loadMenuData(): Promise<{ products: Product[]; categories: Category[] }> {
    // Return cached data if available
    if (cachedProducts && cachedCategories) {
        return { products: cachedProducts, categories: cachedCategories };
    }

    // Deduplicate concurrent fetches
    if (fetchPromise) return fetchPromise;

    fetchPromise = (async () => {
        if (isSupabaseConfigured()) {
            try {
                const data = await fetchFromSupabase();
                if (data.products.length > 0 && data.categories.length > 0) {
                    cachedProducts = data.products;
                    cachedCategories = data.categories;
                    console.log(`[products] Loaded ${data.products.length} products, ${data.categories.length} categories from Supabase`);
                    return data;
                }
            } catch (err) {
                console.warn('[products] Falling back to local data:', err);
            }
        }

        // Fallback to local data
        cachedProducts = LOCAL_PRODUCTS;
        cachedCategories = LOCAL_CATEGORIES;
        console.log(`[products] Using local fallback data (${LOCAL_PRODUCTS.length} products)`);
        return { products: LOCAL_PRODUCTS, categories: LOCAL_CATEGORIES };
    })();

    const result = await fetchPromise;
    fetchPromise = null;
    return result;
}

/**
 * Invalidate the in-memory cache (e.g., after admin updates).
 */
export function invalidateMenuCache(): void {
    cachedProducts = null;
    cachedCategories = null;
    fetchPromise = null;
}

/* ─── Synchronous access (for code that already loaded data) ─── */

/** Get cached products synchronously. Returns local fallback if not yet fetched. */
export function getProducts(): Product[] {
    return cachedProducts || LOCAL_PRODUCTS;
}

/** Get cached categories synchronously. Returns local fallback if not yet fetched. */
export function getCategories(): Category[] {
    return cachedCategories || LOCAL_CATEGORIES;
}

/* ─── Helper functions ─── */

export function getProductsByCategory(categorySlug: string): Product[] {
    const prods = getProducts();
    const cats = getCategories();
    const cat = cats.find(c => c.slug === categorySlug);
    if (!cat) return prods;
    return prods.filter(p => p.category_id === cat.id && p.is_available);
}

export function getProductById(id: string): Product | undefined {
    return getProducts().find(p => p.id === id);
}

export function searchProducts(query: string): Product[] {
    const q = query.toLowerCase();
    return getProducts().filter(p =>
        p.is_available && (
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.tags.some(t => t.includes(q)) ||
            p.dietary.some(d => d.includes(q))
        )
    );
}

/* ═══════════════════════════════════════════════════════════════════════════
   LOCAL FALLBACK DATA
   Used when Supabase is not configured or tables are empty.
   ═══════════════════════════════════════════════════════════════════════════ */

export const LOCAL_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Burgers', slug: 'burgers', icon: '🍔' },
    { id: 'cat-2', name: 'Pizza', slug: 'pizza', icon: '🍕' },
    { id: 'cat-3', name: 'Appetizers', slug: 'appetizers', icon: '🍟' },
    { id: 'cat-4', name: 'Drinks', slug: 'drinks', icon: '🥤' },
    { id: 'cat-5', name: 'Desserts', slug: 'desserts', icon: '🍰' },
];

export const LOCAL_PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        category_id: 'cat-1',
        name: 'Double Beef Burger',
        description: 'Two juicy beef patties with melted cheddar, crispy lettuce, pickles, and our signature smoky sauce on a toasted brioche bun.',
        price: 15.50,
        image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
        tags: ['popular', 'bestseller'],
        allergens: ['gluten', 'dairy'],
        dietary: [],
        is_available: true,
        calories: 850,
        prep_time_min: 12,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: 'Regular', price_modifier: 0, is_default: true },
                    { option_name: 'Large', price_modifier: 3.00, is_default: false },
                ],
            },
            {
                group_name: 'Add-ons',
                choices: [
                    { option_name: 'Extra Cheese', price_modifier: 1.50, is_default: false },
                    { option_name: 'Bacon', price_modifier: 2.00, is_default: false },
                    { option_name: 'Avocado', price_modifier: 2.50, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-2',
        category_id: 'cat-1',
        name: 'Chicken Avocado Burger',
        description: 'Grilled chicken breast with fresh avocado, arugula, tomato, and garlic aioli on a whole wheat bun.',
        price: 14.00,
        image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop',
        tags: ['healthy'],
        allergens: ['gluten'],
        dietary: [],
        is_available: true,
        calories: 620,
        prep_time_min: 10,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: 'Regular', price_modifier: 0, is_default: true },
                    { option_name: 'Large', price_modifier: 3.00, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-3',
        category_id: 'cat-1',
        name: 'Veggie Beyond Burger',
        description: 'Plant-based Beyond patty with vegan cheese, pickled onions, lettuce, and chipotle mayo.',
        price: 13.50,
        image_url: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop',
        tags: ['plant-based'],
        allergens: ['gluten', 'soy'],
        dietary: ['vegan'],
        is_available: true,
        calories: 540,
        prep_time_min: 10,
        options: [],
    },
    {
        id: 'prod-4',
        category_id: 'cat-2',
        name: 'Pepperoni Feast Pizza',
        description: 'Classic pepperoni loaded on a hand-tossed crust with mozzarella and our house-made marinara sauce.',
        price: 18.00,
        image_url: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop',
        tags: ['popular', 'shareable'],
        allergens: ['gluten', 'dairy'],
        dietary: [],
        is_available: true,
        calories: 1200,
        prep_time_min: 18,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: '10" Small', price_modifier: 0, is_default: false },
                    { option_name: '12" Medium', price_modifier: 3.00, is_default: true },
                    { option_name: '14" Large', price_modifier: 6.00, is_default: false },
                ],
            },
            {
                group_name: 'Crust',
                choices: [
                    { option_name: 'Classic', price_modifier: 0, is_default: true },
                    { option_name: 'Thin Crust', price_modifier: 0, is_default: false },
                    { option_name: 'Stuffed Crust', price_modifier: 2.50, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-5',
        category_id: 'cat-2',
        name: 'Margherita Pizza',
        description: 'Fresh mozzarella, San Marzano tomato sauce, and basil on a perfectly charred Neapolitan crust.',
        price: 15.00,
        image_url: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop',
        tags: ['classic'],
        allergens: ['gluten', 'dairy'],
        dietary: ['vegetarian'],
        is_available: true,
        calories: 900,
        prep_time_min: 15,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: '10" Small', price_modifier: 0, is_default: false },
                    { option_name: '12" Medium', price_modifier: 3.00, is_default: true },
                    { option_name: '14" Large', price_modifier: 6.00, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-6',
        category_id: 'cat-3',
        name: 'Spicy Chicken Wings',
        description: 'Crispy fried wings tossed in house-made sriracha glaze. Served with celery sticks and blue cheese dip.',
        price: 12.99,
        image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop',
        tags: ['spicy', 'popular', 'shareable'],
        allergens: ['soy'],
        dietary: [],
        is_available: true,
        calories: 650,
        prep_time_min: 12,
        options: [
            {
                group_name: 'Pieces',
                choices: [
                    { option_name: '6 Pieces', price_modifier: 0, is_default: true },
                    { option_name: '12 Pieces', price_modifier: 6.00, is_default: false },
                ],
            },
            {
                group_name: 'Sauce',
                choices: [
                    { option_name: 'Sriracha Glaze', price_modifier: 0, is_default: true },
                    { option_name: 'Buffalo', price_modifier: 0, is_default: false },
                    { option_name: 'Honey BBQ', price_modifier: 0.50, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-7',
        category_id: 'cat-3',
        name: 'Garlic Parmesan Fries',
        description: 'Crispy golden fries tossed with roasted garlic, parmesan cheese, and fresh herbs.',
        price: 7.50,
        image_url: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?w=400&h=300&fit=crop',
        tags: ['shareable'],
        allergens: ['dairy', 'gluten'],
        dietary: ['vegetarian'],
        is_available: true,
        calories: 420,
        prep_time_min: 8,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: 'Regular', price_modifier: 0, is_default: true },
                    { option_name: 'Large', price_modifier: 3.00, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-8',
        category_id: 'cat-3',
        name: 'Mozzarella Sticks',
        description: 'Golden-fried mozzarella sticks served with warm marinara dipping sauce.',
        price: 8.99,
        image_url: 'https://images.unsplash.com/photo-1531749668029-2db88e4276c7?w=400&h=300&fit=crop',
        tags: ['classic'],
        allergens: ['gluten', 'dairy'],
        dietary: ['vegetarian'],
        is_available: true,
        calories: 510,
        prep_time_min: 8,
        options: [],
    },
    {
        id: 'prod-9',
        category_id: 'cat-4',
        name: 'Vanilla Milkshake',
        description: 'Thick and creamy vanilla milkshake made with real vanilla bean ice cream and topped with whipped cream.',
        price: 6.50,
        image_url: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=300&fit=crop',
        tags: ['sweet'],
        allergens: ['dairy'],
        dietary: ['vegetarian'],
        is_available: true,
        calories: 480,
        prep_time_min: 5,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: 'Regular', price_modifier: 0, is_default: true },
                    { option_name: 'Large', price_modifier: 2.00, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-10',
        category_id: 'cat-4',
        name: 'Fresh Lemonade',
        description: 'Freshly squeezed lemonade with a hint of mint. Refreshing and naturally sweetened.',
        price: 4.50,
        image_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop',
        tags: ['refreshing', 'healthy'],
        allergens: [],
        dietary: ['vegan', 'gluten-free'],
        is_available: true,
        calories: 120,
        prep_time_min: 3,
        options: [],
    },
    {
        id: 'prod-11',
        category_id: 'cat-4',
        name: 'Iced Coffee',
        description: 'Cold brew coffee over ice with your choice of milk. Smooth, bold, and refreshing.',
        price: 5.00,
        image_url: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=300&fit=crop',
        tags: ['caffeine'],
        allergens: ['dairy'],
        dietary: [],
        is_available: true,
        calories: 80,
        prep_time_min: 3,
        options: [
            {
                group_name: 'Milk',
                choices: [
                    { option_name: 'Regular Milk', price_modifier: 0, is_default: true },
                    { option_name: 'Oat Milk', price_modifier: 0.75, is_default: false },
                    { option_name: 'Almond Milk', price_modifier: 0.75, is_default: false },
                ],
            },
        ],
    },
    {
        id: 'prod-12',
        category_id: 'cat-5',
        name: 'Chocolate Lava Cake',
        description: 'Warm molten chocolate cake with a gooey center, served with vanilla ice cream.',
        price: 9.50,
        image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop',
        tags: ['sweet', 'popular'],
        allergens: ['gluten', 'dairy', 'eggs'],
        dietary: ['vegetarian'],
        is_available: true,
        calories: 680,
        prep_time_min: 10,
        options: [],
    },
    {
        id: 'prod-13',
        category_id: 'cat-2',
        name: 'BBQ Chicken Pizza',
        description: 'Smoky BBQ sauce, grilled chicken, red onions, cilantro, and a blend of mozzarella and gouda.',
        price: 19.00,
        image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
        tags: ['smoky', 'popular'],
        allergens: ['gluten', 'dairy'],
        dietary: [],
        is_available: true,
        calories: 1100,
        prep_time_min: 18,
        options: [
            {
                group_name: 'Size',
                choices: [
                    { option_name: '10" Small', price_modifier: 0, is_default: false },
                    { option_name: '12" Medium', price_modifier: 3.00, is_default: true },
                    { option_name: '14" Large', price_modifier: 6.00, is_default: false },
                ],
            },
        ],
    },
];

/* ─── Legacy aliases for backward compatibility ─── */
/** @deprecated Use loadMenuData() for async Supabase access, or getProducts()/getCategories() for sync cached access */
export const products = LOCAL_PRODUCTS;
/** @deprecated Use loadMenuData() for async Supabase access, or getProducts()/getCategories() for sync cached access */
export const categories = LOCAL_CATEGORIES;
