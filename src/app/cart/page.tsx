'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCartStore } from '@/stores/cartStore';
import { useOrderStore } from '@/stores/orderStore';
import { useAuthStore } from '@/stores/authStore';
import styles from './page.module.css';

export default function CartPage() {
    const router = useRouter();
    const { items, promoCode, discountPercent, updateQuantity, removeItem, applyPromo, removePromo, clearCart } = useCartStore();
    const placeOrder = useOrderStore(s => s.placeOrder);
    const user = useAuthStore(s => s.user);
    const [promoInput, setPromoInput] = useState('');
    const [promoError, setPromoError] = useState('');
    const [isPlacing, setIsPlacing] = useState(false);
    const [orderError, setOrderError] = useState('');

    // Compute derived values directly from reactive state so UI updates on every change
    const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);
    const tax = subtotal * 0.08;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal + tax - discount;

    const handleApplyPromo = () => {
        setPromoError('');
        if (!promoInput.trim()) return;
        const success = applyPromo(promoInput);
        if (!success) setPromoError('Invalid promo code. Try SAVE10, WELCOME20, or BISTRO15.');
        else setPromoInput('');
    };

    const handlePlaceOrder = async () => {
        if (items.length === 0) return;
        setOrderError('');

        // Require authentication
        if (!user) {
            router.push('/login?redirect=/cart');
            return;
        }

        setIsPlacing(true);
        const orderItems = items.map(i => ({
            name: i.product.name,
            quantity: i.quantity,
            line_total: i.lineTotal,
            prep_time_min: i.product.prep_time_min,
            ...(i.notes ? { notes: i.notes } : {}),
        }));
        const order = await placeOrder(orderItems, subtotal, tax, discount, total);
        if (!order) {
            setIsPlacing(false);
            setOrderError('Failed to place order. Please try again.');
            return;
        }
        clearCart();
        router.push(`/orders/${order.id}/track`);
    };

    if (items.length === 0) {
        return (
            <div className="page">
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>🛒</span>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven&apos;t added anything yet.</p>
                    <button className="btn btn-primary btn-lg" onClick={() => router.push('/menu')}>
                        Browse Menu
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Your Cart</h1>
                <p className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''} ready to order</p>
            </div>

            <div className={styles.layout}>
                {/* Cart Items */}
                <div className={styles.itemsList}>
                    {items.map((item, i) => (
                        <div key={item.id} className={styles.cartItem} style={{ animationDelay: `${i * 0.05}s` }}>
                            <div className={styles.itemImage}>
                                <Image
                                    src={item.product.image_url}
                                    alt={item.product.name}
                                    fill
                                    sizes="80px"
                                    style={{ objectFit: 'cover' }}
                                />
                            </div>
                            <div className={styles.itemInfo}>
                                <h3 className={styles.itemName}>{item.product.name}</h3>
                                {Object.entries(item.selectedOptions).length > 0 && (
                                    <p className={styles.itemOptions}>
                                        {Object.entries(item.selectedOptions).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                                    </p>
                                )}
                                {item.notes && (
                                    <p className={styles.itemNotes}>📝 {item.notes}</p>
                                )}
                                <div className={styles.itemActions}>
                                    <div className={styles.quantity}>
                                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                                        <span className={styles.qtyValue}>{item.quantity}</span>
                                        <button className={styles.qtyBtn} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                                    </div>
                                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>Remove</button>
                                </div>
                            </div>
                            <div className={styles.itemPrice}>${item.lineTotal.toFixed(2)}</div>
                        </div>
                    ))}
                </div>

                {/* Order Summary */}
                <div className={styles.summary}>
                    <h3 className={styles.summaryTitle}>Order Summary</h3>

                    {/* Promo */}
                    <div className={styles.promoSection}>
                        {promoCode ? (
                            <div className={styles.promoApplied}>
                                <span className="badge badge-success">🏷️ {promoCode} (-{discountPercent}%)</span>
                                <button className={styles.removePromo} onClick={removePromo}>Remove</button>
                            </div>
                        ) : (
                            <div className={styles.promoInput}>
                                <input
                                    type="text"
                                    placeholder="Promo code"
                                    value={promoInput}
                                    onChange={e => { setPromoInput(e.target.value); setPromoError(''); }}
                                    onKeyDown={e => e.key === 'Enter' && handleApplyPromo()}
                                />
                                <button className="btn btn-secondary btn-sm" onClick={handleApplyPromo}>Apply</button>
                            </div>
                        )}
                        {promoError && <p className={styles.promoError}>{promoError}</p>}
                    </div>

                    <div className={styles.summaryLines}>
                        <div className={styles.summaryLine}>
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <div className={styles.summaryLine}>
                            <span>Tax (8%)</span>
                            <span>${tax.toFixed(2)}</span>
                        </div>
                        {discount > 0 && (
                            <div className={`${styles.summaryLine} ${styles.discountLine}`}>
                                <span>Discount</span>
                                <span>-${discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className={styles.totalLine}>
                            <span>Total</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                    </div>

                    <button
                        className={`btn btn-primary btn-lg ${styles.placeOrderBtn}`}
                        onClick={handlePlaceOrder}
                        disabled={isPlacing}
                    >
                        {isPlacing ? 'Placing Order...' : user ? `Place Order — $${total.toFixed(2)}` : `Sign in to Order — $${total.toFixed(2)}`}
                    </button>
                    {orderError && <p style={{ color: 'var(--color-danger)', marginTop: 8, fontSize: 14, textAlign: 'center' }}>{orderError}</p>}
                </div>
            </div>
        </div>
    );
}
