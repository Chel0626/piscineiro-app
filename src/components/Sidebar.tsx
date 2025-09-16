'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Route, X, Package, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { AiHelperDialog } from './AiHelperDialog';
import { ProductCalculatorDialog } from './ProductCalculatorDialog';
import { FillReminderButton } from './FillReminderButton';
import { BillingWidget } from './BillingWidget';
import { Separator } from './ui/separator';
import { ThemeToggle } from './ui/theme-toggle';
import { useAuth } from '@/context/AuthContext';
import { getUserRole } from '@/lib/userRoles';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/roteiros', label: 'Roteiros', icon: Route },
  { href: '/dashboard/produtos-do-dia', label: 'Produtos do Dia', icon: Package },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const isAdmin = user?.email && getUserRole(user.email) === 'admin';

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
          <h2 className="text-2xl font-semibold text-white">PiscineiroApp</h2>
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-gray-700" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        
        <nav className="flex-1 px-4 py-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={cn(
                'flex items-center px-4 py-2 mt-2 text-gray-300 dark:text-gray-400 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white transition-colors',
                { 'bg-gray-700 dark:bg-gray-800 text-white': pathname === item.href, }
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}

          {/* Link Admin - apenas para administradores */}
          {isAdmin && (
            <Link
              href="/dashboard/admin"
              onClick={handleLinkClick}
              className={cn(
                'flex items-center px-4 py-2 mt-2 text-gray-300 dark:text-gray-400 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-800 hover:text-white transition-colors',
                { 'bg-gray-700 dark:bg-gray-800 text-white': pathname === '/dashboard/admin' }
              )}
            >
              <Shield className="h-5 w-5" />
              <span className="ml-3">Admin</span>
            </Link>
          )}

          <Separator className="my-4 bg-gray-700 dark:bg-gray-600" />
          
          <div className="space-y-2">
            <AiHelperDialog />
            <ProductCalculatorDialog />
            <FillReminderButton />
          </div>
        </nav>

        <div className="p-4 space-y-3 border-t border-gray-700 dark:border-gray-600">
          <BillingWidget />
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Button onClick={handleLogout} variant="destructive" className="flex-1 ml-3">
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}