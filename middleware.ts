import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rotas públicas: a raiz, login e cadastro
  const isPublicPath = path === '/' || path === '/login' || path === '/signup';

  const token = request.cookies.get('firebase-auth-token')?.value || '';

  // Se tentando acessar rota protegida SEM token, vai para o login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Se tentando acessar rota pública COM token, vai para o dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/signup',
    '/dashboard/:path*', // Proteger o dashboard e tudo dentro dele
  ],
};