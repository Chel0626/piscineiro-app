'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function useCacheManager() {
  const [isClearing, setIsClearing] = useState(false);

  const clearAllCache = async () => {
    setIsClearing(true);
    try {
      // 1. Limpar localStorage
      localStorage.clear();
      
      // 2. Limpar sessionStorage
      sessionStorage.clear();
      
      // 3. Limpar IndexedDB (Firebase offline cache)
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name) {
                return new Promise<void>((resolve, reject) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name!);
                  deleteReq.onsuccess = () => resolve();
                  deleteReq.onerror = () => reject(deleteReq.error);
                });
              }
            })
          );
        } catch (error) {
          console.warn('Erro ao limpar IndexedDB:', error);
        }
      }
      
      // 4. Limpar Service Worker cache
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (error) {
          console.warn('Erro ao limpar Service Worker cache:', error);
        }
      }
      
      // 5. Desregistrar Service Worker
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(registration => registration.unregister())
          );
        } catch (error) {
          console.warn('Erro ao desregistrar Service Worker:', error);
        }
      }
      
      toast.success('Cache limpo com sucesso! Recarregando...');
      
      // 6. Recarregar a página após um breve delay
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache');
    } finally {
      setIsClearing(false);
    }
  };

  const clearBrowserCache = async () => {
    setIsClearing(true);
    try {
      // Limpar apenas cache do navegador (mais suave)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // Forçar reload sem cache
      window.location.reload();
      
    } catch (error) {
      console.error('Erro ao limpar cache do navegador:', error);
      toast.error('Erro ao limpar cache');
    } finally {
      setIsClearing(false);
    }
  };

  const forceReload = () => {
    // Força reload ignorando cache
    window.location.reload();
  };

  return {
    clearAllCache,
    clearBrowserCache,
    forceReload,
    isClearing
  };
}