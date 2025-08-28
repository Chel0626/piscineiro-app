'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { getAuth, signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/roteiros', label: 'Roteiros', icon: Route },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    const auth = getAuth();
    await signOut(auth);
    // A lógica no AuthProvider vai cuidar de limpar o cookie e redirecionar
  };

  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-gray-800 text-white flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-semibold text-white">PiscineiroApp</h2>
      </div>
      <nav className="flex-1 px-4 py-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center px-4 py-2 mt-2 text-gray-300 rounded-lg hover:bg-gray-700 hover:text-white',
              {
                'bg-gray-700 text-white': pathname === item.href,
              }
            )}
          >
            <item.icon className="h-5 w-5" />
            <span className="ml-3">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Button
          onClick={handleLogout}
          variant="destructive"
          className="w-full"
        >
          Sair
        </Button>
      </div>
    </aside>
  );
}