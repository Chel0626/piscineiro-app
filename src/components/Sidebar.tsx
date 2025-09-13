'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Route, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/roteiros', label: 'Roteiros', icon: Route },
];

// O componente agora aceita props para controlar seu estado
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  const handleLinkClick = () => {
    // Fecha a sidebar sempre que um link é clicado em telas menores
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay para escurecer o fundo quando a sidebar estiver aberta em telas pequenas */}
      <div
        className={cn(
          'fixed inset-0 bg-black/60 z-30 transition-opacity md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
      />

      {/* A sidebar agora usa classes de transição e posicionamento */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800 text-white flex flex-col transition-transform duration-300 ease-in-out',
          // Em telas de desktop (md) ou maiores, ela sempre fica visível
          'md:translate-x-0',
          // Em telas menores, ela desliza para dentro ou para fora da tela
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between p-6">
          <h2 className="text-2xl font-semibold text-white">PiscineiroApp</h2>
          {/* Botão de fechar que só aparece em telas pequenas */}
          <Button variant="ghost" size="icon" className="md:hidden text-white hover:bg-gray-700" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>
        <nav className="flex-1 px-4 py-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick} // Adicionamos o evento de clique aqui
              className={cn(
                'flex items-center px-4 py-2 mt-2 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white',
                { 'bg-gray-700 text-white': pathname === item.href, }
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="ml-3">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-700">
          <Button onClick={handleLogout} variant="destructive" className="w-full">
            Sair
          </Button>
        </div>
      </aside>
    </>
  );
}