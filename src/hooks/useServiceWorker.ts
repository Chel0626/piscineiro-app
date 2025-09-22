'use client';

import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isOnline, setIsOnline] = useState(true);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Registrar o Service Worker
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none' // Nunca usar cache para o SW
          });
          
          console.log('Service Worker registrado com sucesso:', registration);
          setSwRegistration(registration);

          // Verificar atualizações apenas quando necessário (não em loop)
          // Remove o setInterval que estava causando instabilidade

          // Verificar se há uma nova versão apenas uma vez por sessão
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível - mas não força atualização automática
                  console.log('Nova versão disponível!');
                  // Usuário pode atualizar manualmente ou na próxima visita
                }
              });
            }
          });

          // Remove o controllerchange que estava causando reloads automáticos

        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
        }
      };

      registerSW();
    }

    // Monitorar status de conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    setIsOnline(navigator.onLine);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, swRegistration };
}