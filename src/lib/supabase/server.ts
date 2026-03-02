/**
 * Server-side Supabase client for use in Server Components,
 * Route Handlers, and Server Actions.
 *
 * Each call creates a fresh client scoped to the current request
 * via the Next.js cookies() API. This ensures proper session
 * isolation between concurrent requests.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

export async function getSupabaseServer() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // setAll can fail when called from a Server Component
                        // (read-only headers). This is expected — the middleware
                        // will refresh the session before the next request.
                    }
                },
            },
        }
    );
}
