// Script para limpar completamente o cache e Service Worker
// Execute no console do navegador se necessário

async function clearAllCaches() {
  try {
    // 1. Limpar todos os caches
    const cacheNames = await caches.keys();
    console.log('Caches encontrados:', cacheNames);
    
    const deletePromises = cacheNames.map(cacheName => {
      console.log('Deletando cache:', cacheName);
      return caches.delete(cacheName);
    });
    
    await Promise.all(deletePromises);
    console.log('✅ Todos os caches foram limpos!');
    
    // 2. Desregistrar Service Workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      console.log('Service Workers encontrados:', registrations.length);
      
      for (const registration of registrations) {
        console.log('Desregistrando SW:', registration.scope);
        await registration.unregister();
      }
      console.log('✅ Todos os Service Workers foram desregistrados!');
    }
    
    // 3. Limpar localStorage e sessionStorage
    localStorage.clear();
    sessionStorage.clear();
    console.log('✅ Storage limpo!');
    
    // 4. Recarregar página
    console.log('🔄 Recarregando página...');
    window.location.reload(true);
    
  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
  }
}

// Executar automaticamente
clearAllCaches();