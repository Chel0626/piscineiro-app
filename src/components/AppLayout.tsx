'use client';

import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Define quais rotas são "públicas" e não devem ter o layout do dashboard
  const isPublicPath = pathname === '/login' || pathname === '/signup';

  // Se for uma rota pública, apenas renderize o conteúdo da página (ex: o formulário de login)
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Se for uma rota protegida, renderize a estrutura com a Sidebar e o conteúdo principal
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}