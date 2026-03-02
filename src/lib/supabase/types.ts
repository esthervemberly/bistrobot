/**
 * Database type definitions for Supabase.
 *
 * These match the SQL migration in /supabase/migrations/.
 * Regenerate with: npx supabase gen types typescript --linked > src/lib/supabase/types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    display_name: string | null;
                    avatar_url: string | null;
                    phone: string | null;
                    dietary_preferences: string[];
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    phone?: string | null;
                    dietary_preferences?: string[];
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    display_name?: string | null;
                    avatar_url?: string | null;
                    phone?: string | null;
                    dietary_preferences?: string[];
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'profiles_id_fkey';
                        columns: ['id'];
                        isOneToOne: true;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            orders: {
                Row: {
                    id: string;
                    user_id: string;
                    order_number: string;
                    status: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
                    items: Json;
                    subtotal: number;
                    tax: number;
                    discount: number;
                    total: number;
                    created_at: string;
                    estimated_ready_at: string;
                    estimated_minutes: number;
                    timeline: Json;
                };
                Insert: {
                    id?: string;
                    user_id: string;
                    order_number: string;
                    status?: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
                    items: Json;
                    subtotal: number;
                    tax: number;
                    discount: number;
                    total: number;
                    estimated_ready_at: string;
                    estimated_minutes: number;
                    timeline?: Json;
                };
                Update: {
                    status?: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
                    timeline?: Json;
                };
                Relationships: [
                    {
                        foreignKeyName: 'orders_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'users';
                        referencedColumns: ['id'];
                    },
                ];
            };
            categories: {
                Row: {
                    id: string;
                    name: string;
                    slug: string;
                    icon: string | null;
                    sort_order: number;
                    created_at: string;
                };
                Insert: {
                    id?: string;
                    name: string;
                    slug: string;
                    icon?: string | null;
                    sort_order?: number;
                };
                Update: {
                    name?: string;
                    slug?: string;
                    icon?: string | null;
                    sort_order?: number;
                };
                Relationships: [];
            };
            products: {
                Row: {
                    id: string;
                    category_id: string | null;
                    name: string;
                    description: string | null;
                    price: number;
                    image_url: string | null;
                    tags: string[];
                    allergens: string[];
                    dietary: string[];
                    is_available: boolean;
                    calories: number | null;
                    prep_time_min: number;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id?: string;
                    category_id?: string | null;
                    name: string;
                    description?: string | null;
                    price: number;
                    image_url?: string | null;
                    tags?: string[];
                    allergens?: string[];
                    dietary?: string[];
                    is_available?: boolean;
                    calories?: number | null;
                    prep_time_min?: number;
                };
                Update: {
                    name?: string;
                    description?: string | null;
                    price?: number;
                    image_url?: string | null;
                    tags?: string[];
                    allergens?: string[];
                    dietary?: string[];
                    is_available?: boolean;
                    calories?: number | null;
                    prep_time_min?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'products_category_id_fkey';
                        columns: ['category_id'];
                        isOneToOne: false;
                        referencedRelation: 'categories';
                        referencedColumns: ['id'];
                    },
                ];
            };
            product_options: {
                Row: {
                    id: string;
                    product_id: string | null;
                    group_name: string;
                    option_name: string;
                    price_modifier: number;
                    is_default: boolean;
                    sort_order: number;
                };
                Insert: {
                    id?: string;
                    product_id?: string | null;
                    group_name: string;
                    option_name: string;
                    price_modifier?: number;
                    is_default?: boolean;
                    sort_order?: number;
                };
                Update: {
                    group_name?: string;
                    option_name?: string;
                    price_modifier?: number;
                    is_default?: boolean;
                    sort_order?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'product_options_product_id_fkey';
                        columns: ['product_id'];
                        isOneToOne: false;
                        referencedRelation: 'products';
                        referencedColumns: ['id'];
                    },
                ];
            };
            promo_codes: {
                Row: {
                    id: string;
                    code: string;
                    discount_type: 'percentage' | 'fixed';
                    discount_value: number;
                    min_order: number;
                    max_uses: number | null;
                    current_uses: number;
                    valid_from: string;
                    valid_until: string | null;
                    is_active: boolean;
                };
                Insert: {
                    id?: string;
                    code: string;
                    discount_type: 'percentage' | 'fixed';
                    discount_value: number;
                    min_order?: number;
                    max_uses?: number | null;
                    is_active?: boolean;
                };
                Update: {
                    code?: string;
                    discount_type?: 'percentage' | 'fixed';
                    discount_value?: number;
                    min_order?: number;
                    max_uses?: number | null;
                    current_uses?: number;
                    is_active?: boolean;
                };
                Relationships: [];
            };
        };
        Views: Record<string, never>;
        Functions: Record<string, never>;
        Enums: {
            order_status: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
        };
    };
}

/** Convenience aliases */
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
export type DbOrder = Database['public']['Tables']['orders']['Row'];
export type DbCategory = Database['public']['Tables']['categories']['Row'];
export type DbProduct = Database['public']['Tables']['products']['Row'];
export type DbProductOption = Database['public']['Tables']['product_options']['Row'];
export type DbPromoCode = Database['public']['Tables']['promo_codes']['Row'];
