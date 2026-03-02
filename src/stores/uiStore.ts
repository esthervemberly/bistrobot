'use client';

import { create } from 'zustand';
import { Product } from '@/lib/data/products';

interface UIStore {
    sidebarOpen: boolean;
    selectedProduct: Product | null;
    searchQuery: string;
    activeCategory: string;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
    openProductDetail: (product: Product) => void;
    closeProductDetail: () => void;
    setSearchQuery: (query: string) => void;
    setActiveCategory: (slug: string) => void;
}

export const useUIStore = create<UIStore>()((set) => ({
    sidebarOpen: false,
    selectedProduct: null,
    searchQuery: '',
    activeCategory: 'all',

    toggleSidebar: () => set(s => ({ sidebarOpen: !s.sidebarOpen })),
    setSidebarOpen: (open) => set({ sidebarOpen: open }),
    openProductDetail: (product) => set({ selectedProduct: product }),
    closeProductDetail: () => set({ selectedProduct: null }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setActiveCategory: (slug) => set({ activeCategory: slug }),
}));
