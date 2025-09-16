'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu } from 'lucide-react';
import { FillReminderProvider } from '@/context/FillReminderContext';
import { useAuth } from '@/context/AuthContext';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authLoading, isAuthorized } = useAuth();
  // Estado para controlar se a sidebar está aberta ou fechada em telas pequenas
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isProtectedRoute = pathname.startsWith('/dashboard');

  // Verificar autorização para rotas protegidas
  useEffect(() => {
    if (!authLoading && isProtectedRoute && user && !isAuthorized) {
      router.push('/access-denied');
    }
  }, [authLoading, isProtectedRoute, user, isAuthorized, router]);

  if (isProtectedRoute) {
    // Se ainda está carregando ou usuário não autorizado, não renderiza o layout
    if (authLoading || (user && !isAuthorized)) {
      return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
    }

    return (
      <FillReminderProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
          {/* Passamos o estado e a função de controle para a Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          {/* Conteúdo principal */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out md:ml-64">
            {/* Botão "Hambúrguer" que só aparece em telas pequenas */}
            <div className="md:hidden mb-4 flex items-center">
              <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(true)}>
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex items-center gap-2 ml-4">
                <img src="/logo-icon.svg" alt="PiscineiroApp" className="w-6 h-6" />
                <h2 className="text-xl font-semibold dark:text-white">PiscineiroApp</h2>
              </div>
            </div>
            
            {children}
          </main>
        </div>
      </FillReminderProvider>
    );
  }

  // Se for uma rota pública, renderiza apenas o conteúdo
  return <>{children}</>;
}