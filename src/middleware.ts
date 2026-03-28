import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const isAuthRoute = path === '/login' || path === '/signup';
  const isProtectedRoute = path.startsWith('/admin') || path.startsWith('/operador') || path.startsWith('/dispensador') || path.startsWith('/display');

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
    // Determine redirect based on user role/entity if possible
    // For now, redirect to /admin/dashboard
    const dashboardUrl = new URL('/admin/dashboard', request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
