'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/lib/data/products';

export interface CartItem {
    id: string;
    product: Product;
    quantity: number;
    selectedOptions: Record<string, string>;
    notes: string;
    lineTotal: number;
}

interface CartStore {
    items: CartItem[];
    promoCode: string | null;
    discountPercent: number;
    addItem: (product: Product, quantity: number, selectedOptions: Record<string, string>, notes?: string) => void;
    updateQuantity: (itemId: string, quantity: number) => void;
    removeItem: (itemId: string) => void;
    applyPromo: (code: string) => boolean;
    removePromo: () => void;
    clearCart: () => void;
    getItemCount: () => number;
    getSubtotal: () => number;
    getTax: () => number;
    getDiscount: () => number;
    getTotal: () => number;
}

function calculateLineTotal(product: Product, quantity: number, selectedOptions: Record<string, string>): number {
    let price = product.price;
    for (const option of product.options) {
        const selected = selectedOptions[option.group_name];
        if (selected) {
            const choice = option.choices.find(c => c.option_name === selected);
            if (choice) price += choice.price_modifier;
        }
    }
    return price * quantity;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            promoCode: null,
            discountPercent: 0,

            addItem: (product, quantity, selectedOptions, notes = '') => {
                const existingKey = `${product.id}-${JSON.stringify(selectedOptions)}-${notes}`;
                const items = get().items;
                const existing = items.find(
                    i => `${i.product.id}-${JSON.stringify(i.selectedOptions)}-${i.notes}` === existingKey
                );

                if (existing) {
                    set({
                        items: items.map(i =>
                            i.id === existing.id
                                ? {
                                    ...i,
                                    quantity: i.quantity + quantity,
                                    lineTotal: calculateLineTotal(product, i.quantity + quantity, selectedOptions),
                                }
                                : i
                        ),
                    });
                } else {
                    const newItem: CartItem = {
                        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        product,
                        quantity,
                        selectedOptions,
                        notes,
                        lineTotal: calculateLineTotal(product, quantity, selectedOptions),
                    };
                    set({ items: [...items, newItem] });
                }
            },

            updateQuantity: (itemId, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(itemId);
                    return;
                }
                set({
                    items: get().items.map(i =>
                        i.id === itemId
                            ? { ...i, quantity, lineTotal: calculateLineTotal(i.product, quantity, i.selectedOptions) }
                            : i
                    ),
                });
            },

            removeItem: (itemId) => {
                set({ items: get().items.filter(i => i.id !== itemId) });
            },

            applyPromo: (code) => {
                const validCodes: Record<string, number> = {
                    'SAVE10': 10,
                    'WELCOME20': 20,
                    'BISTRO15': 15,
                };
                const discount = validCodes[code.toUpperCase()];
                if (discount) {
                    set({ promoCode: code.toUpperCase(), discountPercent: discount });
                    return true;
                }
                return false;
            },

            removePromo: () => set({ promoCode: null, discountPercent: 0 }),

            clearCart: () => set({ items: [], promoCode: null, discountPercent: 0 }),

            getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

            getSubtotal: () => get().items.reduce((sum, i) => sum + i.lineTotal, 0),

            getTax: () => get().getSubtotal() * 0.08,

            getDiscount: () => get().getSubtotal() * (get().discountPercent / 100),

            getTotal: () => {
                const subtotal = get().getSubtotal();
                const tax = subtotal * 0.08;
                const discount = subtotal * (get().discountPercent / 100);
                return subtotal + tax - discount;
            },
        }),
        {
            name: 'bistrobot-cart',
        }
    )
);
