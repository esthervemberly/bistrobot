'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { BotIcon, ChatIcon, MenuIcon, OrdersIcon, CartIcon, UserIcon } from '@/components/icons/Icons';
import styles from './Sidebar.module.css';

const navItems = [
    { href: '/', label: 'Chat', icon: <ChatIcon size={18} /> },
    { href: '/menu', label: 'Menu', icon: <MenuIcon size={18} /> },
    { href: '/orders', label: 'My Orders', icon: <OrdersIcon size={18} /> },
];

export default function Sidebar() {
    const pathname = usePathname();
    const itemCount = useCartStore(s => s.getItemCount());
    const { sidebarOpen, setSidebarOpen } = useUIStore();
    const { user, profile, initialized, initialize } = useAuthStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        initialize();
    }, [initialize]);

    const displayName = profile?.display_name
        || user?.user_metadata?.display_name
        || user?.email?.split('@')[0]
        || null;

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
                {/* Logo */}
                <Link href="/" className={styles.logo} onClick={() => setSidebarOpen(false)}>
                    <span className={styles.logoIcon}><BotIcon size={28} /></span>
                    <span className={styles.logoText}>BistroBot</span>
                </Link>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {navItems.map(item => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`${styles.navItem} ${pathname === item.href ? styles.active : ''}`}
                            onClick={() => setSidebarOpen(false)}
                        >
                            <span className={styles.navIcon}>{item.icon}</span>
                            <span className={styles.navLabel}>{item.label}</span>
                        </Link>
                    ))}

                    {/* Cart link with badge */}
                    <Link
                        href="/cart"
                        className={`${styles.navItem} ${pathname === '/cart' ? styles.active : ''}`}
                        onClick={() => setSidebarOpen(false)}
                    >
                        <span className={styles.navIcon}><CartIcon size={18} /></span>
                        <span className={styles.navLabel}>Cart</span>
                        {mounted && itemCount > 0 && <span className={styles.badge}>{itemCount}</span>}
                    </Link>
                </nav>

                {/* Footer */}
                <div className={styles.footer}>
                    {mounted && initialized && user ? (
                        <Link href="/profile" className={styles.userInfo} onClick={() => setSidebarOpen(false)}>
                            <div className={styles.userAvatar}>
                                {profile?.avatar_url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <UserIcon size={16} />
                                )}
                            </div>
                            <div className={styles.userMeta}>
                                <span className={styles.userDisplayName}>{displayName}</span>
                                <span className={styles.userEmail}>{user.email}</span>
                            </div>
                        </Link>
                    ) : (
                        <Link href="/login" className={styles.loginBtn} onClick={() => setSidebarOpen(false)}>
                            Sign In
                        </Link>
                    )}
                    <p className={styles.footerText}>© 2026 BistroBot</p>
                </div>
            </aside>

            {/* Mobile bottom nav */}
            <nav className={styles.mobileNav}>
                {navItems.slice(0, 3).map(item => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`${styles.mobileNavItem} ${pathname === item.href ? styles.mobileActive : ''}`}
                    >
                        <span>{item.icon}</span>
                        <span className={styles.mobileLabel}>{item.label}</span>
                    </Link>
                ))}
                <Link
                    href="/cart"
                    className={`${styles.mobileNavItem} ${pathname === '/cart' ? styles.mobileActive : ''}`}
                >
                    <span style={{ position: 'relative' }}>
                        <CartIcon size={18} />
                        {mounted && itemCount > 0 && <span className={styles.mobileBadge}>{itemCount}</span>}
                    </span>
                    <span className={styles.mobileLabel}>Cart</span>
                </Link>
            </nav>
        </>
    );
}
