import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTHORIZED_TEST_EMAILS } from '@/lib/userRoles';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Rotas públicas: a raiz, login e cadastro
  const isPublicPath = path === '/' || path === '/login' || path === '/signup';

  const token = request.cookies.get('firebase-auth-token')?.value || '';
  const userEmail = request.cookies.get('user-email')?.value || '';

  // Verificar se o usuário está na lista de autorizados
  if (userEmail && !AUTHORIZED_TEST_EMAILS.includes(userEmail)) {
    // Usuário não autorizado - redirecionar para página de acesso negado
    if (!path.startsWith('/access-denied')) {
      return NextResponse.redirect(new URL('/access-denied', request.nextUrl));
    }
  }

  // Se tentando acessar rota protegida SEM token, vai para o login
  if (!isPublicPath && !token && !path.startsWith('/access-denied')) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // Se tentando acessar rota pública COM token, vai para o dashboard
  if (isPublicPath && token && userEmail && AUTHORIZED_TEST_EMAILS.includes(userEmail)) {
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