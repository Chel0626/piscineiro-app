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

          // Verificar se há uma nova versão a cada 5 segundos
          setInterval(() => {
            registration.update();
          }, 5000);

          // Verificar se há uma nova versão
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nova versão disponível - força atualização automática
                  console.log('Nova versão disponível! Atualizando automaticamente...');
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  
                  // Recarrega a página após 1 segundo
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });

          // Detecta quando o SW assume controle (após atualização)
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            console.log('Service Worker atualizado! Recarregando página...');
            window.location.reload();
          });

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