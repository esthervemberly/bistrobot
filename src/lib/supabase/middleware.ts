/**
 * Supabase middleware helper.
 *
 * Refreshes expired auth tokens on every request by reading/writing
 * cookies through the NextResponse. This keeps the server-side session
 * fresh without requiring a client-side refresh dance.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/** Routes that require authentication */
const PROTECTED_ROUTES = ['/profile', '/orders'];

/** Routes only accessible when NOT authenticated */
const AUTH_ROUTES = ['/login'];

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    // Forward cookies to the browser via the response
                    cookiesToSet.forEach(({ name, value, options }) => {
                        request.cookies.set(name, value);
                    });
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // IMPORTANT: Do NOT use supabase.auth.getSession() — it reads from
    // storage without validating the JWT. getUser() hits the auth server
    // and is the only safe way to verify the session in middleware.
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Redirect unauthenticated users away from protected routes
    if (!user && PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = '/login';
        loginUrl.searchParams.set('redirect', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from auth routes
    if (user && AUTH_ROUTES.some(route => pathname.startsWith(route))) {
        const homeUrl = request.nextUrl.clone();
        homeUrl.pathname = '/';
        return NextResponse.redirect(homeUrl);
    }

    return supabaseResponse;
}
