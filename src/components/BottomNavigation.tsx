'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Route, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/clientes', label: 'Clientes', icon: Users },
  { href: '/dashboard/roteiros', label: 'Roteiros', icon: Route },
  { href: '/dashboard/produtos-do-dia', label: 'Produtos', icon: Package },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 md:ml-64">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full px-2 py-2 text-xs transition-colors',
                isActive
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              )}
            >
              <item.icon className={cn('h-5 w-5 mb-1', isActive && 'scale-110')} />
              <span className="font-medium truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}