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
          // Limpar registros antigos primeiro
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const registration of registrations) {
            console.log('Desregistrando SW antigo:', registration);
            await registration.unregister();
          }

          // Aguardar um pouco antes de registrar novamente
          await new Promise(resolve => setTimeout(resolve, 100));

          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
            updateViaCache: 'none'
          });
          
          console.log('Service Worker registrado com sucesso:', registration);
          setSwRegistration(registration);

          // Verificar atualizações apenas uma vez
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('Nova versão do SW disponível');
                }
              });
            }
          });

        } catch (error) {
          console.error('Erro ao registrar Service Worker:', error);
          // Em caso de erro, não bloqueia a aplicação
        }
      };

      registerSW();
    }

    // Monitorar status de conexão
    const handleOnline = () => {
      console.log('Conexão restaurada');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('Conexão perdida');
      setIsOnline(false);
    };

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