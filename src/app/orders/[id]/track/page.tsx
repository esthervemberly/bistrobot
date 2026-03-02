'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

const statusSteps = [
    { key: 'confirmed', label: 'Confirmed', icon: '✓', description: 'Order received' },
    { key: 'preparing', label: 'Preparing', icon: '👨‍🍳', description: 'Kitchen is working on it' },
    { key: 'ready', label: 'Ready', icon: '📦', description: 'Ready for pickup' },
    { key: 'delivered', label: 'Delivered', icon: '🎉', description: 'Enjoy your meal!' },
];

function OrderTrackContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const getOrderById = useOrderStore(s => s.getOrderById);
    const fetchOrderById = useOrderStore(s => s.fetchOrderById);
    const orders = useOrderStore(s => s.orders);
    const [now, setNow] = useState(new Date());
    const [loading, setLoading] = useState(true);

    // Fetch order from Supabase if not in local cache
    useEffect(() => {
        async function loadOrder() {
            const local = getOrderById(id);
            if (!local) {
                await fetchOrderById(id);
            }
            setLoading(false);
        }
        loadOrder();
    }, [id, getOrderById, fetchOrderById]);

    // Live countdown — update every second
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const order = getOrderById(id);

    if (loading) {
        return (
            <div className="page">
                <div className={styles.empty}>
                    <span style={{ fontSize: 48 }}>⏳</span>
                    <h2>Loading order...</h2>
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="page">
                <div className={styles.empty}>
                    <span style={{ fontSize: 48 }}>🔍</span>
                    <h2>Order not found</h2>
                    <p>We couldn&apos;t find this order.</p>
                    <button className="btn btn-primary" onClick={() => router.push('/orders')}>
                        View All Orders
                    </button>
                </div>
            </div>
        );
    }

    const currentStepIndex = statusSteps.findIndex(s => s.key === order.status);
    const isComplete = order.status === 'delivered';

    const formatTime = (dateStr: string) => {
        return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    // Compute live countdown
    const eta = new Date(order.estimated_ready_at);
    const diffMs = Math.max(0, eta.getTime() - now.getTime());
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffSeconds = Math.floor((diffMs % 60000) / 1000);

    const getETADisplay = () => {
        if (isComplete) return 'Delivered!';
        if (order.status === 'ready') return 'Ready for pickup!';
        if (order.status === 'cancelled') return 'Cancelled';
        if (diffMs <= 0) return 'Any moment now...';
        return `${String(diffMinutes).padStart(2, '0')}:${String(diffSeconds).padStart(2, '0')}`;
    };

    const getETASubtext = () => {
        if (isComplete || order.status === 'ready' || order.status === 'cancelled') return '';
        if (diffMs <= 0) return 'Your order should be ready soon';
        return `Estimated ${order.estimated_minutes} min total`;
    };

    // Progress bar percentage
    const totalMs = order.estimated_minutes * 60000;
    const elapsedMs = Math.max(0, now.getTime() - new Date(order.created_at).getTime());
    const progressPct = isComplete ? 100 : Math.min(95, Math.round((elapsedMs / totalMs) * 100));

    return (
        <div className="page">
            <div className={styles.container}>
                {/* Header */}
                <div className={styles.header}>
                    <button className="btn btn-ghost btn-sm" onClick={() => router.push('/orders')}>
                        ← Back to Orders
                    </button>
                    <h1 className={styles.title}>Order {order.order_number}</h1>
                    <div className={styles.countdown}>
                        <span className={styles.countdownValue}>{getETADisplay()}</span>
                        {getETASubtext() && (
                            <span className={styles.countdownLabel}>{getETASubtext()}</span>
                        )}
                    </div>

                    {/* Progress bar */}
                    {!isComplete && order.status !== 'cancelled' && (
                        <div className={styles.progressBar}>
                            <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                        </div>
                    )}
                </div>

                {/* Timeline */}
                <div className={styles.timeline}>
                    {statusSteps.map((step, i) => {
                        const isPast = i <= currentStepIndex;
                        const isCurrent = i === currentStepIndex;
                        const timelineEntry = order.timeline.find(t => t.status === step.key);

                        return (
                            <div key={step.key} className={`${styles.step} ${isPast ? styles.past : ''} ${isCurrent ? styles.current : ''}`}>
                                <div className={styles.stepIndicator}>
                                    <div className={styles.stepDot}>
                                        {isPast ? step.icon : <span className={styles.dotEmpty}></span>}
                                    </div>
                                    {i < statusSteps.length - 1 && (
                                        <div className={`${styles.stepLine} ${isPast ? styles.linePast : ''}`}></div>
                                    )}
                                </div>
                                <div className={styles.stepContent}>
                                    <h4 className={styles.stepLabel}>{step.label}</h4>
                                    <p className={styles.stepDesc}>{step.description}</p>
                                    {timelineEntry && (
                                        <span className={styles.stepTime}>{formatTime(timelineEntry.at)}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Order Summary */}
                <div className={styles.summary}>
                    <h3 className={styles.summaryTitle}>Order Summary</h3>
                    <div className={styles.items}>
                        {order.items.map((item, i) => (
                            <div key={i} className={styles.item}>
                                <div className={styles.itemMain}>
                                    <span>{item.name} ×{item.quantity}</span>
                                    {item.notes && (
                                        <p className={styles.itemNotes}>📝 {item.notes}</p>
                                    )}
                                    {item.prep_time_min && (
                                        <span className={styles.itemPrep}>⏱️ {item.prep_time_min} min</span>
                                    )}
                                </div>
                                <span>${item.line_total.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.totals}>
                        <div className={styles.totalRow}>
                            <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
                        </div>
                        <div className={styles.totalRow}>
                            <span>Tax</span><span>${order.tax.toFixed(2)}</span>
                        </div>
                        {order.discount > 0 && (
                            <div className={`${styles.totalRow} ${styles.discountRow}`}>
                                <span>Discount</span><span>-${order.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className={styles.totalFinal}>
                            <span>Total</span><span>${order.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function OrderTrackPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <AuthGuard>
            <OrderTrackContent params={params} />
        </AuthGuard>
    );
}
