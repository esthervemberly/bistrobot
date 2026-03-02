/**
 * Order store — manages orders via Supabase for authenticated users.
 *
 * Orders are saved to the Supabase `orders` table and are scoped
 * per-user via RLS policies. The store fetches the user's orders
 * on initialization and syncs all mutations to Supabase.
 *
 * `simulateProgress` still uses local setTimeouts for the demo
 * experience, but each status change is also persisted to Supabase.
 */

'use client';

import { create } from 'zustand';
import type { Database, DbOrder } from '@/lib/supabase/types';

export interface OrderItem {
    name: string;
    quantity: number;
    line_total: number;
    prep_time_min?: number;
    notes?: string;
}

export interface Order {
    id: string;
    user_id?: string;
    order_number: string;
    status: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled';
    items: OrderItem[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    created_at: string;
    estimated_ready_at: string;
    estimated_minutes: number;
    timeline: { status: string; at: string }[];
}

interface OrderStore {
    orders: Order[];
    activeOrderId: string | null;
    loading: boolean;
    initialized: boolean;
    error: string | null;

    /** Fetch orders from Supabase for the current user */
    fetchOrders: () => Promise<void>;
    /** Place a new order — requires authentication */
    placeOrder: (items: OrderItem[], subtotal: number, tax: number, discount: number, total: number) => Promise<Order | null>;
    getActiveOrder: () => Order | undefined;
    getOrderById: (id: string) => Order | undefined;
    /** Fetch a single order by ID from Supabase (useful when navigating directly) */
    fetchOrderById: (id: string) => Promise<Order | null>;
    simulateProgress: (orderId: string, estimatedMinutes: number) => void;
    /** Reset store state (e.g. on sign-out) */
    reset: () => void;
}

/* ─── Supabase guard ─── */

function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co'
    );
}

async function getClient() {
    const { getSupabaseBrowser } = await import('@/lib/supabase/client');
    return getSupabaseBrowser();
}

function generateOrderNumber(): string {
    return `#${Math.floor(80000 + Math.random() * 20000)}`;
}

/** Convert a Supabase orders row into our local Order shape */
function dbRowToOrder(row: Database['public']['Tables']['orders']['Row']): Order {
    return {
        id: row.id,
        user_id: row.user_id,
        order_number: row.order_number,
        status: row.status,
        items: row.items as unknown as OrderItem[],
        subtotal: row.subtotal,
        tax: row.tax,
        discount: row.discount,
        total: row.total,
        created_at: row.created_at,
        estimated_ready_at: row.estimated_ready_at,
        estimated_minutes: row.estimated_minutes,
        timeline: row.timeline as unknown as { status: string; at: string }[],
    };
}

export const useOrderStore = create<OrderStore>()((set, get) => ({
    orders: [],
    activeOrderId: null,
    loading: false,
    initialized: false,
    error: null,

    fetchOrders: async () => {
        if (!isSupabaseConfigured()) {
            set({ initialized: true });
            return;
        }

        set({ loading: true, error: null });
        try {
            const supabase = await getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ orders: [], loading: false, initialized: true });
                return;
            }

            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Failed to fetch orders:', error.message);
                set({ loading: false, initialized: true, error: error.message });
                return;
            }

            set({
                orders: ((data || []) as DbOrder[]).map(dbRowToOrder),
                loading: false,
                initialized: true,
            });
        } catch (err) {
            console.error('Failed to fetch orders:', err);
            set({ loading: false, initialized: true, error: 'Failed to load orders.' });
        }
    },

    placeOrder: async (items, subtotal, tax, discount, total) => {
        if (!isSupabaseConfigured()) {
            set({ error: 'Supabase is not configured.' });
            return null;
        }

        set({ loading: true, error: null });
        try {
            const supabase = await getClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                set({ loading: false, error: 'You must be signed in to place an order.' });
                return null;
            }

            // Calculate ETA as the accumulated sum of all items' prep times
            const totalPrepTime = items.reduce((sum, i) => sum + (i.prep_time_min || 10) * i.quantity, 0);
            const estimatedMinutes = Math.max(totalPrepTime, 3); // at least 3 minutes

            const now = new Date();
            const estimated = new Date(now.getTime() + estimatedMinutes * 60000);
            const timeline = [{ status: 'confirmed', at: now.toISOString() }];

            const { data, error } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    order_number: generateOrderNumber(),
                    status: 'confirmed' as const,
                    items: items as unknown as Database['public']['Tables']['orders']['Insert']['items'],
                    subtotal,
                    tax,
                    discount,
                    total,
                    estimated_ready_at: estimated.toISOString(),
                    estimated_minutes: estimatedMinutes,
                    timeline: timeline as unknown as Database['public']['Tables']['orders']['Insert']['timeline'],
                })
                .select()
                .single();

            if (error || !data) {
                console.error('Failed to place order:', error?.message);
                set({ loading: false, error: error?.message || 'Failed to place order.' });
                return null;
            }

            const order = dbRowToOrder(data as DbOrder);
            set({
                orders: [order, ...get().orders],
                activeOrderId: order.id,
                loading: false,
            });

            // Auto-progress the order with timing based on actual ETA
            get().simulateProgress(order.id, estimatedMinutes);
            return order;
        } catch (err) {
            console.error('Failed to place order:', err);
            set({ loading: false, error: 'Failed to place order.' });
            return null;
        }
    },

    getActiveOrder: () => {
        const { orders, activeOrderId } = get();
        return orders.find(o => o.id === activeOrderId);
    },

    getOrderById: (id) => get().orders.find(o => o.id === id),

    fetchOrderById: async (id) => {
        if (!isSupabaseConfigured()) return null;

        // Check local cache first
        const cached = get().orders.find(o => o.id === id);
        if (cached) return cached;

        try {
            const supabase = await getClient();
            const { data, error } = await supabase
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !data) return null;

            const order = dbRowToOrder(data as DbOrder);
            // Add to local cache if not already there
            if (!get().orders.find(o => o.id === order.id)) {
                set({ orders: [order, ...get().orders] });
            }
            return order;
        } catch {
            return null;
        }
    },

    simulateProgress: (orderId, estimatedMinutes) => {
        // The countdown runs in real time for estimatedMinutes.
        // 'ready' fires exactly when the countdown hits 0:00.
        const etaMs = estimatedMinutes * 60000;
        const stages = [
            { status: 'preparing', delay: 2000 }, // start prep after 2s
            { status: 'ready', delay: etaMs }, // ready exactly when countdown reaches 0
            { status: 'delivered', delay: etaMs + 10000 }, // delivered 10s after ready
        ];

        stages.forEach(({ status, delay }) => {
            setTimeout(async () => {
                const newTimeline = { status, at: new Date().toISOString() };

                // Update local state
                const orders = get().orders.map(o => {
                    if (o.id === orderId && o.status !== 'cancelled') {
                        return {
                            ...o,
                            status: status as Order['status'],
                            timeline: [...o.timeline, newTimeline],
                        };
                    }
                    return o;
                });
                set({ orders });

                // Persist to Supabase
                if (isSupabaseConfigured()) {
                    try {
                        const supabase = await getClient();
                        const order = get().orders.find(o => o.id === orderId);
                        if (order) {
                            await supabase
                                .from('orders')
                                .update({
                                    status: status as Order['status'],
                                    timeline: order.timeline as unknown as Database['public']['Tables']['orders']['Update']['timeline'],
                                })
                                .eq('id', orderId);
                        }
                    } catch (err) {
                        console.error('Failed to sync order status:', err);
                    }
                }
            }, delay);
        });
    },

    reset: () => {
        set({ orders: [], activeOrderId: null, loading: false, initialized: false, error: null });
    },
}));
