/**
 * Next.js Middleware
 *
 * Runs on every matched request to:
 * 1. Refresh the Supabase auth session (token rotation via cookies)
 * 2. Protect routes that require authentication
 * 3. Redirect authenticated users away from /login
 *
 * The middleware never blocks public routes like /, /menu, or /cart.
 */

import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
    return await updateSession(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         * - Public assets in /public
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
