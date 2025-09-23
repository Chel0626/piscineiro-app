'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Route } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: Home,
    shortLabel: 'Home'
  },
  { 
    href: '/dashboard/clientes', 
    label: 'Clientes', 
    icon: Users,
    shortLabel: 'Clientes'
  },
  { 
    href: '/dashboard/roteiros', 
    label: 'Roteiros', 
    icon: Route,
    shortLabel: 'Roteiros'
  },
];

export function BottomTabBar() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="grid grid-cols-3 h-16">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-1 py-2 text-xs transition-colors',
                isActive 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
              )}
            >
              <item.icon className={cn(
                'h-5 w-5 mb-1',
                isActive && 'text-blue-600 dark:text-blue-400'
              )} />
              <span className={cn(
                'font-medium',
                isActive && 'text-blue-600 dark:text-blue-400'
              )}>
                {item.shortLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}