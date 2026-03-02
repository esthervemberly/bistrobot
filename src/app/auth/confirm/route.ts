/**
 * Email confirmation handler.
 *
 * When a user clicks the confirmation link in their email,
 * Supabase redirects here with a token_hash and type.
 * We verify it server-side and redirect to home.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const token_hash = searchParams.get('token_hash');
    const type = searchParams.get('type') as 'signup' | 'email' | 'recovery' | 'invite' | null;
    const next = searchParams.get('next') ?? '/';

    if (token_hash && type) {
        const supabase = await getSupabaseServer();
        const { error } = await supabase.auth.verifyOtp({ token_hash, type });

        if (!error) {
            return NextResponse.redirect(new URL(next, request.url));
        }
    }

    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url));
}
