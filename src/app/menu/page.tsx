'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { loadMenuData, getProducts, getCategories, type Product, type Category } from '@/lib/data/products';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import ProductDetailModal from '@/components/menu/ProductDetailModal';
import styles from './page.module.css';

export default function MenuPage() {
    const { activeCategory, setActiveCategory, searchQuery, setSearchQuery, selectedProduct, openProductDetail, closeProductDetail } = useUIStore();
    const addItem = useCartStore(s => s.addItem);
    const [addedId, setAddedId] = useState<string | null>(null);
    const [menuProducts, setMenuProducts] = useState<Product[]>(getProducts());
    const [menuCategories, setMenuCategories] = useState<Category[]>(getCategories());
    const [loading, setLoading] = useState(true);

    // Fetch menu data from Supabase on mount
    useEffect(() => {
        loadMenuData().then(({ products, categories }) => {
            setMenuProducts(products);
            setMenuCategories(categories);
            setLoading(false);
        });
    }, []);

    const filtered = menuProducts.filter(p => {
        if (!p.is_available) return false;
        if (activeCategory !== 'all') {
            const cat = menuCategories.find(c => c.slug === activeCategory);
            if (cat && p.category_id !== cat.id) return false;
        }
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            return p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.tags.some(t => t.includes(q));
        }
        return true;
    });

    const handleQuickAdd = (p: Product) => {
        const defaults: Record<string, string> = {};
        p.options.forEach(opt => {
            const def = opt.choices.find(c => c.is_default);
            if (def) defaults[opt.group_name] = def.option_name;
        });
        addItem(p, 1, defaults);
        setAddedId(p.id);
        setTimeout(() => setAddedId(null), 1500);
    };

    return (
        <div className="page">
            <div className={styles.header}>
                <div>
                    <h1 className="page-title">Our Menu</h1>
                    <p className="page-subtitle">Fresh ingredients, bold flavors, made with love.</p>
                </div>
            </div>

            {/* Search */}
            <div className={styles.searchBar}>
                <span className={styles.searchIcon}>🔍</span>
                <input
                    type="text"
                    placeholder="Search dishes, ingredients, dietary..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
                {searchQuery && (
                    <button className={styles.clearBtn} onClick={() => setSearchQuery('')}>✕</button>
                )}
            </div>

            {/* Categories */}
            <div className={styles.categories}>
                <button
                    className={`chip ${activeCategory === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveCategory('all')}
                >
                    🍽️ All
                </button>
                {menuCategories.map(cat => (
                    <button
                        key={cat.id}
                        className={`chip ${activeCategory === cat.slug ? 'active' : ''}`}
                        onClick={() => setActiveCategory(cat.slug)}
                    >
                        {cat.icon} {cat.name}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className={styles.grid}>
                {filtered.map((product, i) => (
                    <div
                        key={product.id}
                        className={styles.productCard}
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <div
                            className={styles.productImage}
                            onClick={() => openProductDetail(product)}
                        >
                            <Image
                                src={product.image_url}
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                style={{ objectFit: 'cover' }}
                            />
                            {product.tags.includes('popular') && (
                                <span className={styles.popularBadge}>🔥 Popular</span>
                            )}
                            {product.dietary.length > 0 && (
                                <span className={styles.dietaryBadge}>
                                    {product.dietary.map(d => d === 'vegan' ? '🌱' : d === 'vegetarian' ? '🥬' : '').join('')}
                                </span>
                            )}
                        </div>
                        <div className={styles.productInfo}>
                            <h3
                                className={styles.productName}
                                onClick={() => openProductDetail(product)}
                            >
                                {product.name}
                            </h3>
                            <p className={styles.productDesc}>{product.description}</p>
                            <div className={styles.productFooter}>
                                <span className={styles.price}>${product.price.toFixed(2)}</span>
                                <button
                                    className={`btn btn-primary btn-sm ${addedId === product.id ? styles.addedBtn : ''}`}
                                    onClick={() => product.options.length > 0 ? openProductDetail(product) : handleQuickAdd(product)}
                                >
                                    {addedId === product.id ? '✓ Added' : product.options.length > 0 ? 'Customize' : 'Add +'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className={styles.empty}>
                    <span style={{ fontSize: 48 }}>🍽️</span>
                    <p>No dishes found. Try a different search or category.</p>
                </div>
            )}

            {/* Product Detail Modal */}
            {selectedProduct && (
                <ProductDetailModal product={selectedProduct} onClose={closeProductDetail} />
            )}
        </div>
    );
}
