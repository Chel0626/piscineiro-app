const CACHE_NAME = 'piscineiro-app-v3'; // Versão estável
const STATIC_CACHE_NAME = 'piscineiro-static-v3';
const CURRENT_VERSION = '3.0.0'; // Versão semântica mais estável

// Recursos estáticos que devem ser sempre cachados
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/login',
  '/signup',
  '/manifest.json',
  '/favicon.ico',
  '/logo-icon.svg',
  '/logo.svg',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/_next/static/css/app/layout.css',
  '/_next/static/css/app/globals.css'
];

// URLs que devem ser servidas do cache quando offline
const CACHE_URLS = [
  '/dashboard',
  '/dashboard/clientes',
  '/dashboard/roteiros',
  '/dashboard/produtos-do-dia',
  '/login',
  '/signup'
];

// Instalar o Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker v3.0.0...');
  
  event.waitUntil(
    Promise.all([
      // Cacheia os recursos estáticos
      caches.open(STATIC_CACHE_NAME).then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
      }),
      caches.open(CACHE_NAME).then((cache) => {
        console.log('[SW] Caching app pages');
        return cache.addAll(CACHE_URLS);
      })
    ]).then(() => {
      console.log('[SW] Installation complete');
      // Não força skipWaiting imediatamente - deixa mais estável
    }).catch((error) => {
      console.error('[SW] Installation failed:', error);
    })
  );
});

// Ativar o Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker v3.0.0...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Remove apenas caches realmente antigos, não v3
          if (!cacheName.includes('v3')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Activation complete');
      return self.clients.claim();
    })
  );
});

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignorar requisições não HTTP
  if (!request.url.startsWith('http')) {
    return;
  }

  // Ignorar requisições para APIs externas e Firebase
  if (url.hostname.includes('firebase') || 
      url.hostname.includes('googleapis') ||
      url.hostname.includes('firestore') ||
      url.pathname.startsWith('/api/')) {
    return;
  }

  // Strategy: Cache First para recursos estáticos
  if (STATIC_ASSETS.some(asset => request.url.includes(asset)) ||
      request.url.includes('_next/static/') ||
      request.url.includes('.css') ||
      request.url.includes('.js') ||
      request.url.includes('.png') ||
      request.url.includes('.svg') ||
      request.url.includes('.ico')) {
    
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
        });
      }).catch(() => {
        // Se falhar, retorna uma resposta padrão para imagens
        if (request.url.includes('.png') || request.url.includes('.svg') || request.url.includes('.ico')) {
          return new Response('', { status: 200, statusText: 'OK' });
        }
      })
    );
    return;
  }

  // Strategy: Network First para páginas da aplicação
  if (request.method === 'GET' && 
      (CACHE_URLS.some(url => request.url.includes(url)) || 
       request.mode === 'navigate')) {
    
    event.respondWith(
      fetch(request, { cache: 'no-cache' }).then((response) => {
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
          
          // Se não encontrar no cache, tenta retornar a página principal
          return caches.match('/').then((fallbackResponse) => {
            if (fallbackResponse) {
              return fallbackResponse;
            }
            
            // Página offline básica como último recurso
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>PiscineiroApp - Offline</title>
                  <style>
                    body { 
                      font-family: Arial, sans-serif; 
                      text-align: center; 
                      padding: 50px; 
                      background: #f5f5f5; 
                    }
                    .container { 
                      max-width: 500px; 
                      margin: 0 auto; 
                      background: white; 
                      padding: 30px; 
                      border-radius: 10px; 
                      box-shadow: 0 2px 10px rgba(0,0,0,0.1); 
                    }
                    .icon { 
                      font-size: 48px; 
                      margin-bottom: 20px; 
                    }
                    h1 { 
                      color: #0284c7; 
                      margin-bottom: 10px; 
                    }
                    p { 
                      color: #666; 
                      line-height: 1.5; 
                    }
                    button {
                      background: #0284c7;
                      color: white;
                      border: none;
                      padding: 12px 24px;
                      border-radius: 6px;
                      cursor: pointer;
                      font-size: 16px;
                      margin-top: 20px;
                    }
                    button:hover {
                      background: #0369a1;
                    }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <div class="icon">🏊‍♂️</div>
                    <h1>PiscineiroApp</h1>
                    <p>Você está offline. Algumas funcionalidades podem estar limitadas.</p>
                    <p>Verifique sua conexão com a internet e tente novamente.</p>
                    <button onclick="window.location.reload()">Tentar Novamente</button>
                  </div>
                </body>
              </html>
            `, {
              headers: { 'Content-Type': 'text/html' }
            });
          });
        });
      })
    );
  }
});

// Manipular mensagens do cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});