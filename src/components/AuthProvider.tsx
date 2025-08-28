'use client'; // 
import { useEffect, useState } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter, usePathname } from 'next/navigation';

// Função para chamar a nossa API de login
const syncAuthCookie = async (token: string) => {
  await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
};

// Função para chamar a nossa API de logout
const clearAuthCookie = async () => {
  await fetch('/api/auth/logout', {
    method: 'POST',
  });
};

export function AuthProvider({ children }: { children: React.React.Node }) {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Usamos onIdTokenChanged para ser mais rápido na detecção
    const unsubscribe = onIdTokenChanged(auth, async (newUser) => {
      const oldUser = user;
      setUser(newUser);

      // Se o estado do usuário mudou
      if (newUser?.uid !== oldUser?.uid) {
        if (newUser) {
          const token = await newUser.getIdToken();
          await syncAuthCookie(token);
        } else {
          await clearAuthCookie();
          // Força o redirecionamento no logout se estiver em uma página protegida
          if (pathname !== '/login' && pathname !== '/signup') {
            router.push('/login');
          }
        }
      }
    });

    return () => unsubscribe();
  }, [user, router, pathname]);

  return <>{children}</>;
}