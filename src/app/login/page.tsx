'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import styles from './page.module.css';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, initialized, loading, error: authError, initialize, signIn, signUp, signInWithGoogle, clearError } = useAuthStore();

    const [mode, setMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [localError, setLocalError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const redirectTo = searchParams.get('redirect') || '/';
    const callbackError = searchParams.get('error');

    useEffect(() => {
        initialize();
    }, [initialize]);

    // Redirect if already authenticated
    useEffect(() => {
        if (initialized && user) {
            router.replace(redirectTo);
        }
    }, [initialized, user, router, redirectTo]);

    // Show callback errors
    useEffect(() => {
        if (callbackError === 'auth_callback_failed') {
            setLocalError('Sign-in failed. Please try again.');
        } else if (callbackError === 'verification_failed') {
            setLocalError('Email verification failed. The link may have expired.');
        }
    }, [callbackError]);

    const displayError = localError || authError || '';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMsg('');
        clearError();

        if (!email || !password) { setLocalError('Please fill in all fields.'); return; }
        if (mode === 'signup' && !name) { setLocalError('Please enter your name.'); return; }
        if (password.length < 6) { setLocalError('Password must be at least 6 characters.'); return; }

        if (mode === 'signup') {
            const { error } = await signUp(email, password, name);
            if (!error) {
                setSuccessMsg('Account created! Check your email to confirm your account.');
                setMode('login');
            }
        } else {
            const { error } = await signIn(email, password);
            if (!error) {
                router.replace(redirectTo);
            }
        }
    };

    const handleGoogleSignIn = async () => {
        setLocalError('');
        clearError();
        await signInWithGoogle();
    };

    const switchMode = (newMode: 'login' | 'signup') => {
        setMode(newMode);
        setLocalError('');
        setSuccessMsg('');
        clearError();
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🤖</span>
                    <span className={styles.logoText}>BistroBot</span>
                </div>

                <h1 className={styles.title}>
                    {mode === 'login' ? 'Welcome back!' : 'Create your account'}
                </h1>
                <p className={styles.subtitle}>
                    {mode === 'login'
                        ? 'Sign in to access your orders and preferences.'
                        : 'Join BistroBot for a personalized dining experience.'}
                </p>

                {/* Google OAuth */}
                <button className={styles.googleBtn} onClick={handleGoogleSignIn} disabled={loading}>
                    <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" /><path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" /><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" /><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" /></svg>
                    Continue with Google
                </button>

                <div className={styles.divider}>
                    <span>or</span>
                </div>

                {successMsg && <p className={styles.success}>{successMsg}</p>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    {mode === 'signup' && (
                        <div className={styles.field}>
                            <label>Display Name</label>
                            <input
                                type="text"
                                placeholder="Alex"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                autoComplete="name"
                            />
                        </div>
                    )}

                    <div className={styles.field}>
                        <label>Email</label>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    <div className={styles.field}>
                        <label>Password</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                            minLength={6}
                        />
                    </div>

                    {displayError && <p className={styles.error}>{displayError}</p>}

                    <button
                        type="submit"
                        className={`btn btn-primary btn-lg ${styles.submitBtn}`}
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>
                </form>

                <div className={styles.toggle}>
                    {mode === 'login' ? (
                        <p>Don&apos;t have an account? <button onClick={() => switchMode('signup')}>Sign up</button></p>
                    ) : (
                        <p>Already have an account? <button onClick={() => switchMode('login')}>Sign in</button></p>
                    )}
                </div>

                <button className={styles.guestBtn} onClick={() => router.push('/')}>
                    Continue as Guest →
                </button>
            </div>
        </div>
    );
}
