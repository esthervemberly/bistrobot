/**
 * Auth store — manages authentication state across the app.
 *
 * Uses Supabase's onAuthStateChange listener to keep the session
 * in sync. Profile data is fetched separately from the `profiles`
 * table after sign-in.
 *
 * The store gracefully falls back to a "guest" state when Supabase
 * env vars are missing, so the app still runs in development without
 * a Supabase project.
 */

'use client';

import { create } from 'zustand';
import type { User, Session, AuthError } from '@supabase/supabase-js';
import type { Profile, ProfileUpdate } from '@/lib/supabase/types';

/* ─── Supabase availability guard ─── */

function isSupabaseConfigured(): boolean {
    return !!(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://your-project-id.supabase.co'
    );
}

/** Lazy-import the browser client only when configured */
async function getClient() {
    const { getSupabaseBrowser } = await import('@/lib/supabase/client');
    return getSupabaseBrowser();
}

/* ─── Types ─── */

export interface AuthState {
    /** Whether the initial session check has completed */
    initialized: boolean;
    /** Currently signed-in user (null = guest) */
    user: User | null;
    /** Current session (includes tokens) */
    session: Session | null;
    /** Profile record from the `profiles` table */
    profile: Profile | null;
    /** Loading states */
    loading: boolean;
    /** Last auth error message */
    error: string | null;

    /* ─── Actions ─── */
    initialize: () => Promise<void>;
    signUp: (email: string, password: string, displayName: string) => Promise<{ error: string | null }>;
    signIn: (email: string, password: string) => Promise<{ error: string | null }>;
    signInWithGoogle: () => Promise<{ error: string | null }>;
    signOut: () => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (updates: Partial<Pick<Profile, 'display_name' | 'phone' | 'dietary_preferences'>>) => Promise<{ error: string | null }>;
    clearError: () => void;
}

/* ─── Helpers ─── */

function friendlyError(err: AuthError | Error): string {
    const msg = err.message.toLowerCase();
    if (msg.includes('invalid login')) return 'Invalid email or password.';
    if (msg.includes('already registered') || msg.includes('already been registered')) return 'An account with this email already exists.';
    if (msg.includes('weak password') || msg.includes('at least')) return 'Password must be at least 6 characters.';
    if (msg.includes('rate limit')) return 'Too many attempts. Please wait a moment.';
    if (msg.includes('email not confirmed')) return 'Please check your inbox and confirm your email.';
    if (msg.includes('network') || msg.includes('fetch')) return 'Network error. Check your connection.';
    return err.message;
}

/* ─── Store ─── */

export const useAuthStore = create<AuthState>()((set, get) => ({
    initialized: false,
    user: null,
    session: null,
    profile: null,
    loading: false,
    error: null,

    initialize: async () => {
        if (get().initialized) return;

        if (!isSupabaseConfigured()) {
            set({ initialized: true });
            return;
        }

        try {
            const supabase = await getClient();
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                set({
                    user: data.session.user,
                    session: data.session,
                    initialized: true,
                });
                get().fetchProfile();
            } else {
                set({ initialized: true });
            }

            // Listen for auth state changes (sign-in, sign-out, token refresh)
            supabase.auth.onAuthStateChange((_event, session) => {
                set({
                    user: session?.user ?? null,
                    session,
                });
                if (session?.user) {
                    get().fetchProfile();
                } else {
                    set({ profile: null });
                }
            });
        } catch {
            set({ initialized: true });
        }
    },

    signUp: async (email, password, displayName) => {
        if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };
        set({ loading: true, error: null });
        try {
            const supabase = await getClient();
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: { display_name: displayName },
                },
            });
            if (error) {
                const msg = friendlyError(error);
                set({ loading: false, error: msg });
                return { error: msg };
            }
            set({ loading: false });
            return { error: null };
        } catch (e) {
            const msg = e instanceof Error ? friendlyError(e) : 'Unexpected error.';
            set({ loading: false, error: msg });
            return { error: msg };
        }
    },

    signIn: async (email, password) => {
        if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };
        set({ loading: true, error: null });
        try {
            const supabase = await getClient();
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                const msg = friendlyError(error);
                set({ loading: false, error: msg });
                return { error: msg };
            }
            set({ loading: false });
            return { error: null };
        } catch (e) {
            const msg = e instanceof Error ? friendlyError(e) : 'Unexpected error.';
            set({ loading: false, error: msg });
            return { error: msg };
        }
    },

    signInWithGoogle: async () => {
        if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };
        set({ loading: true, error: null });
        try {
            const supabase = await getClient();
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                },
            });
            if (error) {
                const msg = friendlyError(error);
                set({ loading: false, error: msg });
                return { error: msg };
            }
            // OAuth redirects away — loading stays true
            return { error: null };
        } catch (e) {
            const msg = e instanceof Error ? friendlyError(e) : 'Unexpected error.';
            set({ loading: false, error: msg });
            return { error: msg };
        }
    },

    signOut: async () => {
        if (!isSupabaseConfigured()) return;
        set({ loading: true });
        try {
            const supabase = await getClient();
            await supabase.auth.signOut();
            set({ user: null, session: null, profile: null, loading: false });
        } catch {
            set({ loading: false });
        }
    },

    fetchProfile: async () => {
        if (!isSupabaseConfigured()) return;
        const user = get().user;
        if (!user) return;

        try {
            const supabase = await getClient();
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!error && data) {
                set({ profile: data as Profile });
            }
        } catch {
            // Profile fetch failure is non-fatal
        }
    },

    updateProfile: async (updates) => {
        if (!isSupabaseConfigured()) return { error: 'Supabase is not configured.' };
        const user = get().user;
        if (!user) return { error: 'Not authenticated.' };

        set({ loading: true, error: null });
        try {
            const supabase = await getClient();
            const updateData: ProfileUpdate = {
                ...updates,
                updated_at: new Date().toISOString(),
            };
            const { error } = await supabase
                .from('profiles')
                .update(updateData)
                .eq('id', user.id);

            if (error) {
                const msg = error.message;
                set({ loading: false, error: msg });
                return { error: msg };
            }

            // Refresh local profile
            await get().fetchProfile();
            set({ loading: false });
            return { error: null };
        } catch (e) {
            const msg = e instanceof Error ? e.message : 'Failed to update profile.';
            set({ loading: false, error: msg });
            return { error: msg };
        }
    },

    clearError: () => set({ error: null }),
}));
