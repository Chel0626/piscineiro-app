'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // ================== CORREÇÃO APLICADA AQUI ==================
  // A regra agora é simples: se a rota começa com /dashboard, é uma rota protegida.
  const isProtectedRoute = pathname.startsWith('/dashboard');
  // ==========================================================

  if (isProtectedRoute) {
    // Se for uma rota protegida, renderize a estrutura com a Sidebar
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 ml-64 p-8 bg-gray-50">
          {children}
        </main>
      </div>
    );
  }

  // Se for uma rota pública (landing, login, signup), renderize apenas o conteúdo
  return <>{children}</>;
}