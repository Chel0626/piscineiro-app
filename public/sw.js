const CACHE_NAME = 'piscineiro-app-v1';
const RUNTIME_CACHE = 'piscineiro-runtime-v1';

// Assets que queremos cachear imediatamente (quando o SW instala)
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/login',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[SW] Precaching app shell');
      // Cachear recursos individualmente para evitar falhas totais
      const cachePromises = PRECACHE_URLS.map(async (url) => {
        try {
          const response = await fetch(url);
          if (response.ok) {
            await cache.put(url, response);
            console.log('[SW] Cached:', url);
          } else {
            console.warn('[SW] Failed to cache (not ok):', url, response.status);
          }
        } catch (error) {
          console.warn('[SW] Failed to cache:', url, error.message);
        }
      });
      await Promise.allSettled(cachePromises);
      console.log('[SW] Precaching completed');
    })
  );
  self.skipWaiting();
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Estratégia de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignora requisições de outras origens (exceto Firebase)
  if (url.origin !== location.origin && !url.origin.includes('firebase')) {
    return;
  }

  // Estratégia Network First para API e Firebase (dados sempre frescos)
  if (
    request.url.includes('/api/') ||
    request.url.includes('firestore.googleapis.com') ||
    request.url.includes('firebase')
  ) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Salva no cache para uso offline
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Se offline, tenta buscar do cache
          return caches.match(request);
        })
    );
    return;
  }

  // Estratégia Cache First para assets estáticos (performance)
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna do cache mas atualiza em background
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, response);
            });
          }
        });
        return cachedResponse;
      }

      // Se não está no cache, busca da rede
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      });
    })
  );
});

// Mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
