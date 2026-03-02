'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useOrderStore } from '@/stores/orderStore';
import AuthGuard from '@/components/auth/AuthGuard';
import styles from './page.module.css';

function OrdersContent() {
    const router = useRouter();
    const orders = useOrderStore(s => s.orders);
    const loading = useOrderStore(s => s.loading);
    const initialized = useOrderStore(s => s.initialized);
    const fetchOrders = useOrderStore(s => s.fetchOrders);

    useEffect(() => {
        if (!initialized) {
            fetchOrders();
        }
    }, [initialized, fetchOrders]);

    const statusColors: Record<string, string> = {
        confirmed: 'badge-accent',
        preparing: 'badge-warning',
        ready: 'badge-success',
        out_for_delivery: 'badge-accent',
        delivered: 'badge-success',
        cancelled: 'badge-danger',
    };

    const formatDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    if (loading || !initialized) {
        return (
            <div className="page">
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>⏳</span>
                    <h2>Loading orders...</h2>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="page">
                <div className={styles.empty}>
                    <span className={styles.emptyIcon}>📦</span>
                    <h2>No orders yet</h2>
                    <p>Your order history will appear here.</p>
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
                <h1 className="page-title">My Orders</h1>
                <p className="page-subtitle">Track, manage, and quickly reorder your favorite meals.</p>
            </div>

            <div className={styles.orderList}>
                {orders.map((order, i) => (
                    <div
                        key={order.id}
                        className={styles.orderCard}
                        style={{ animationDelay: `${i * 0.05}s` }}
                    >
                        <div className={styles.orderHeader}>
                            <div>
                                <h3 className={styles.orderNumber}>{order.order_number}</h3>
                                <p className={styles.orderDate}>{formatDate(order.created_at)}</p>
                            </div>
                            <span className={`badge ${statusColors[order.status] || 'badge-accent'}`}>
                                {order.status.replace(/_/g, ' ')}
                            </span>
                        </div>

                        <div className={styles.orderItems}>
                            {order.items.map((item, j) => (
                                <span key={j} className={styles.orderItemTag}>
                                    {item.name} ×{item.quantity}
                                </span>
                            ))}
                        </div>

                        <div className={styles.orderFooter}>
                            <div className={styles.orderMeta}>
                                <span className={styles.orderTotal}>${order.total.toFixed(2)}</span>
                                <span className={styles.orderCount}>{order.items.reduce((s, i) => s + i.quantity, 0)} items</span>
                            </div>
                            <div className={styles.orderActions}>
                                <button
                                    className={`btn btn-sm ${order.status !== 'delivered' && order.status !== 'cancelled' ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => router.push(`/orders/${order.id}/track`)}
                                >
                                    {order.status !== 'delivered' && order.status !== 'cancelled' ? 'Track Order' : 'View Details'}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function OrdersPage() {
    return (
        <AuthGuard>
            <OrdersContent />
        </AuthGuard>
    );
}