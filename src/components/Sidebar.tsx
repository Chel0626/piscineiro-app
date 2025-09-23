'use client';

import { useState } from 'react';
import { X, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AiHelperDialog } from './AiHelperDialog';
import { ProductCalculatorDialog } from './ProductCalculatorDialog';
import { FillReminderButton } from './FillReminderButton';
import { BillingWidget } from './BillingWidget';
import { PiscineiroProfileWidget } from './PiscineiroProfileWidget';
import { ClienteAvulsoModal } from './ClienteAvulsoModal';
import { Separator } from './ui/separator';
import { ThemeToggle } from './ui/theme-toggle';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isClienteAvulsoModalOpen, setIsClienteAvulsoModalOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    // Limpa o cookie de autenticação para um logout completo
    await fetch('/api/logout', { method: 'POST' });
    // Redireciona para a página de login
    window.location.href = '/login';
  };

  const handleLinkClick = () => {
    // Fecha a sidebar em telas pequenas ao clicar em um link
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          // ✅ CORREÇÃO: Trocamos h-screen por h-dvh (dynamic viewport height)
          // Isso garante que a altura da sidebar se ajuste dinamicamente,
          // nunca ficando escondida atrás da barra do navegador.
          'fixed top-0 left-0 z-40 w-64 h-dvh bg-gray-800 dark:bg-gray-900 text-white flex flex-col transition-transform duration-300 ease-in-out border-r border-gray-700 dark:border-gray-800',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-3">
            <img src="/logo-icon.svg" alt="PiscineiroApp" className="w-8 h-8" />
            <h2 className="text-xl font-semibold text-white">PiscineiroApp</h2>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-gray-700" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Seção de Ferramentas */}
        <div className="flex-1 px-4 py-2 overflow-y-auto pb-safe">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Ferramentas
            </h3>
            <div className="space-y-2">
              <AiHelperDialog />
              <ProductCalculatorDialog />
              <FillReminderButton />
              <Button 
                onClick={() => setIsClienteAvulsoModalOpen(true)}
                className="w-full justify-start bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Users className="h-4 w-4 mr-2" />
                Cliente Avulso
              </Button>
            </div>
          </div>

          <Separator className="my-4 bg-gray-700 dark:bg-gray-600" />
          
          {/* Seção do Perfil */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Perfil
            </h3>
            <PiscineiroProfileWidget />
          </div>
        </div>

        {/* Seção de Configurações */}
        <div className="p-4 space-y-3 border-t border-gray-700 dark:border-gray-600 pb-24 md:pb-4 mb-safe bg-gray-800 dark:bg-gray-900 relative z-50">
          <BillingWidget />
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button onClick={handleLogout} variant="destructive" className="flex-1 ml-3">
              Sair
            </Button>
          </div>
        </div>
      </aside>
      
      <ClienteAvulsoModal 
        isOpen={isClienteAvulsoModalOpen} 
        onClose={() => setIsClienteAvulsoModalOpen(false)} 
      />
    </>
  );
}