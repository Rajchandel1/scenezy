import { createServerClient } from '@supabase/ssr';
import type { EmailOtpType } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const destinationFor = (type: EmailOtpType | null) =>
  type === 'recovery' ? '/reset-password' : '/auth/callback';

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get('token_hash');
  const type = request.nextUrl.searchParams.get('type') as EmailOtpType | null;
  const destination = destinationFor(type);
  const successUrl = new URL(destination, request.url);
  let response = NextResponse.redirect(successUrl);

  if (tokenHash && type) {
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: cookiesToSet => {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    if (!error) return response;
  }

  const errorUrl = new URL(destination, request.url);
  errorUrl.searchParams.set('error', 'invalid_link');
  response = NextResponse.redirect(errorUrl);
  return response;
}
