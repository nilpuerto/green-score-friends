// Service Worker para GreenHunters PWA
const CACHE_NAME = 'greenhunters-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/logo.jpg',
  '/manifest.json'
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activación del Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Estrategia: Network First, luego Cache
self.addEventListener('fetch', (event) => {
  const urlString = event.request.url;
  const method = event.request.method;
  
  // CRÍTICO: Ignorar COMPLETAMENTE cualquier request a Supabase, API, o que no sea GET
  // NO interceptar estos requests, dejar que pasen directamente sin cachear
  if (urlString.includes('supabase.co') || 
      urlString.includes('rest/v1/') ||
      urlString.includes('/api/') ||
      method !== 'GET') {
    // NO hacer nada, dejar que el navegador maneje estos requests normalmente
    return;
  }

  // Solo procesar archivos estáticos GET
  const url = new URL(urlString);
  const isStaticFile = url.pathname.match(/\.(html|css|js|jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|eot)$/i);
  
  if (!isStaticFile) {
    // NO interceptar archivos no estáticos
    return;
  }

  // Solo para archivos estáticos GET
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Solo cachear respuestas exitosas de archivos estáticos GET
        if (response && 
            response.status === 200 && 
            response.type === 'basic' &&
            isStaticFile &&
            !urlString.includes('supabase.co')) {
          // Clonar la respuesta antes de cachear
          const responseToCache = response.clone();
          
          // Cachear de forma asíncrona sin bloquear
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache).catch(() => {
                // Ignorar errores silenciosamente
              });
            })
            .catch(() => {
              // Ignorar errores silenciosamente
            });
        }
        
        return response;
      })
      .catch(() => {
        // Si falla la red, intentar desde el cache
        return caches.match(event.request);
      })
  );
});

