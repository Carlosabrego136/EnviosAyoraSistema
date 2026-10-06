import { NextResponse, type NextRequest } from 'next/server';

const SESSION_COOKIE = 'fenix_session';

/**
 * Primera barrera del panel: sin cookie de sesión no se llega a ninguna ruta de /admin
 * (salvo el login). La validación real (firma, expiración, usuario activo) ocurre en el servidor
 * en cada página y en cada acción.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/admin/login';
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);

  if (!isLogin && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  const response = NextResponse.next();
  response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  response.headers.set('Cache-Control', 'no-store, max-age=0');
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
