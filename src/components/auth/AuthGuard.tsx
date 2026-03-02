/**
 * AuthGuard — wraps protected pages requiring authentication.
 *
 * Shows a loading skeleton while the auth state initializes,
 * then redirects to /login if the user is not signed in.
 * Server-side middleware also protects these routes, so this
 * is a secondary client-side guard for a smoother UX.
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
    children: React.ReactNode;
    /** Where to redirect if not authenticated (default: /login) */
    fallback?: string;
}

export default function AuthGuard({ children, fallback = '/login' }: AuthGuardProps) {
    const router = useRouter();
    const { initialized, user, initialize } = useAuthStore();

    useEffect(() => {
        initialize();
    }, [initialize]);

    useEffect(() => {
        if (initialized && !user) {
            const redirect = encodeURIComponent(window.location.pathname);
            router.replace(`${fallback}?redirect=${redirect}`);
        }
    }, [initialized, user, router, fallback]);

    // Still loading
    if (!initialized) {
        return (
            <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{
                        width: 40,
                        height: 40,
                        border: '3px solid var(--border-primary)',
                        borderTopColor: 'var(--accent)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        margin: '0 auto 16px',
                    }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading...</p>
                </div>
            </div>
        );
    }

    // Not authenticated — redirect is happening
    if (!user) return null;

    return <>{children}</>;
}
