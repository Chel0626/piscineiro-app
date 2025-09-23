const CACHE_NAME = 'piscineiro-app-v4';
const STATIC_CACHE_NAME = 'piscineiro-static-v4';
const CURRENT_VERSION = '4.0.0';

// Recursos essenciais que devem ser cachados
const ESSENTIAL_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/logo-icon.svg'
];

// URLs das páginas principais
const PAGE_URLS = [
  '/dashboard',
  '/login',
  '/signup'
];

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing Service Worker v${CURRENT_VERSION}...`);
  
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching essential assets');
        return cache.addAll(ESSENTIAL_ASSETS).catch(error => {
          console.error('[SW] Failed to cache essential assets:', error);
        });
      }),
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching pages');
        return Promise.all(
          PAGE_URLS.map(url => 
            cache.add(url).catch(error => {
              console.warn(`[SW] Failed to cache ${url}:`, error);
            })
          )
        );
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Force ativação para corrigir problemas de versão
      self.skipWaiting();
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating Service Worker v${CURRENT_VERSION}...`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove todas as versões antigas (v1, v2, v3)
          if (!cacheName.includes('v4')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    }).catch((error) => {
      console.error('[SW] Activation failed:', error);
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar requisições não HTTP/HTTPS
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignorar APIs externas, Firebase e APIs internas
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore') ||
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/webpack-hmr')) {
    return;
  }

  // Para recursos estáticos: Cache First
  if (request.url.includes('_next/static/') ||
      request.url.includes('.css') ||
      request.url.includes('.js') ||
      request.url.includes('.png') ||
      request.url.includes('.svg') ||
      request.url.includes('.ico') ||
      ESSENTIAL_ASSETS.some(asset => request.url.endsWith(asset))) {
    
    event.respondWith(
      caches.match(request).then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(request).then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // Fallback silencioso para recursos estáticos
          return new Response('', { status: 200, statusText: 'OK' });
        });
      })
    );
    return;
  }

  // Para navegação de páginas: Network First com fallback
  if (request.method === 'GET' && request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(() => {
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          // Fallback para página principal
          return caches.match('/').then((fallbackResponse) => {
            if (fallbackResponse) {
              return fallbackResponse;
            }
            
            // Página offline mínima
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>PiscineiroApp - Offline</title>
                  <style>
                    body { 
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                      text-align: center; 
                      padding: 50px 20px; 
                      background: #f8fafc; 
                      margin: 0;
                    }
                    .container { 
                      max-width: 400px; 
                      margin: 0 auto; 
                      background: white; 
                      padding: 40px 30px; 
                      border-radius: 12px; 
                      box-shadow: 0 4px 20px rgba(0,0,0,0.1); 
                    }
                    h1 { 
                      color: #0284c7; 
                      margin: 20px 0 10px 0; 
                      font-size: 24px;
                    }
                    p { 
                      color: #64748b; 
                      line-height: 1.6; 
                      margin: 15px 0;
                    }
                    button {
                      background: #0284c7;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 8px;
                      cursor: pointer;
                      font-size: 16px;
                      margin-top: 20px;
                      transition: background 0.2s;
                    }
                    button:hover {
                      background: #0369a1;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div style="font-size: 48px; margin-bottom: 20px;">🏊‍♂️</div>
                    <h1>PiscineiroApp</h1>
                    <p>Você está offline no momento.</p>
                    <p>Verifique sua conexão e tente novamente.</p>
                    <button onclick="window.location.reload()">Reconectar</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          });
        });
      })
    );
  }
});

// Lidar com mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});