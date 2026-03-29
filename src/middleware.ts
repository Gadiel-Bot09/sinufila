import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request);

  const path = request.nextUrl.pathname;
  const searchParams = request.nextUrl.searchParams;

  const isAuthRoute = path === '/login' || path === '/signup' || path === '/forgot-password' || path === '/reset-password';

  // Dispensador y Display son públicos cuando se accede con ?entity=UUID (modo kiosk/TV)
  // Si no tienen el param, se requiere sesión (el admin los abre logueado)
  const isPublicKioskRoute =
    (path.startsWith('/dispensador') || path.startsWith('/display')) &&
    searchParams.has('entity');

  const isProtectedRoute =
    !isPublicKioskRoute &&
    (path.startsWith('/admin') ||
      path.startsWith('/operador') ||
      path.startsWith('/dispensador') ||
      path.startsWith('/display'));

  if (isProtectedRoute && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectTo', path);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && user) {
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
