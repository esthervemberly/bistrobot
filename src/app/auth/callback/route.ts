/**
 * OAuth callback handler.
 *
 * After Google (or other OAuth provider) sign-in, Supabase redirects
 * here with an authorization code. We exchange it for a session,
 * which sets the auth cookies, then redirect the user to the
 * intended destination.
 */

import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
        const supabase = await getSupabaseServer();
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
            return NextResponse.redirect(`${origin}${next}`);
        }
    }

    // Code exchange failed — redirect to login with error
    return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
