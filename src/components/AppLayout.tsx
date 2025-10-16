'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Menu, ShowerHead } from 'lucide-react';
import { FillReminderProvider } from '@/context/FillReminderContext';
import { FillReminderButton } from './FillReminderButton';
import { AuthContextProvider, useAuth } from '@/context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, authLoading } = useAuth();
  // Estado para controlar se a sidebar está aberta ou fechada em telas pequenas
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const isProtectedRoute = pathname.startsWith('/dashboard');
  const isSetupRoute = pathname === '/setup-piscineiro';

  // Verificar se o usuário tem perfil completo
  useEffect(() => {
    const checkProfile = async () => {
      if (!user || authLoading || !isProtectedRoute || isSetupRoute) return;
      
      try {
        const profileRef = doc(db, 'piscineiroProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (!profileSnap.exists()) {
          // Se não tem perfil, redireciona para setup
          router.push('/setup-piscineiro');
        }
      } catch (error) {
        console.error('Erro ao verificar perfil:', error);
      }
    };

    checkProfile();
  }, [user, authLoading, isProtectedRoute, isSetupRoute, router]);

  if (isProtectedRoute) {
    return (
      <FillReminderProvider>
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
          {/* Passamos o estado e a função de controle para a Sidebar */}
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          
          {/* Conteúdo principal */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out md:ml-64 pb-20 md:pb-8 overflow-x-hidden w-full">
            {/* Header com botão hambúrguer e abastecimento */}
            <div className="md:hidden mb-4 flex items-center justify-between">
              <div className="flex items-center">
                <Button variant="outline" size="icon" onClick={() => setIsSidebarOpen(true)}>
                  <Menu className="h-6 w-6" />
                </Button>
                <div className="flex items-center gap-2 ml-4">
                  <img src="/logo-icon.svg" alt="PiscineiroApp" className="w-6 h-6" />
                  <h2 className="text-xl font-semibold dark:text-white">PiscineiroApp</h2>
                </div>
              </div>
              
              {/* Botão de Abastecimento no canto direito */}
              <FillReminderButton 
                variant="outline" 
                size="icon"
                icon={<ShowerHead className="h-5 w-5" />}
                showText={false}
              />
            </div>

            {/* Header para desktop */}
            <div className="hidden md:flex justify-end mb-4">
              <FillReminderButton 
                icon={<ShowerHead className="h-4 w-4" />}
                showText={true}
              />
            </div>
            
            {children}
          </main>
          
          {/* Bottom Tab Bar - SEMPRE visível em mobile */}
          <BottomTabBar />
        </div>
      </FillReminderProvider>
    );
  }

  // Se for uma rota pública, renderiza apenas o conteúdo
  return <>{children}</>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthContextProvider>
      <AppLayoutInner>{children}</AppLayoutInner>
    </AuthContextProvider>
  );
}