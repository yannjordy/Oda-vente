const CACHE_NAME = 'odamarket-v1.0.0';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    '/oda.jpg',
    '/oda.png',
    '/oda.png',
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;800&display=swap'
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installation en cours...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[Service Worker] Mise en cache des fichiers');
                return cache.addAll(ASSETS_TO_CACHE);
            })
            .then(() => {
                console.log('[Service Worker] Tous les fichiers sont mis en cache');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[Service Worker] Erreur lors de la mise en cache:', error);
            })
    );
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activation...');
    
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[Service Worker] Suppression de l\'ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('[Service Worker] Activé avec succès');
            return self.clients.claim();
        })
    );
});

// Interception des requêtes (Stratégie: Cache First avec Network Fallback)
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                // Si on trouve dans le cache, on le retourne
                if (cachedResponse) {
                    return cachedResponse;
                }
                
                // Sinon, on fait la requête réseau
                return fetch(event.request)
                    .then((networkResponse) => {
                        // Vérifier si c'est une réponse valide
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Cloner la réponse
                        const responseToCache = networkResponse.clone();
                        
                        // Mettre en cache la nouvelle réponse
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                        
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.error('[Service Worker] Erreur de récupération:', error);
                        
                        // Retourner une page hors ligne personnalisée si disponible
                        if (event.request.destination === 'document') {
                            return caches.match('/');
                        }
                    });
            })
    );
});

// Gestion des messages
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// Notification de mise à jour disponible
self.addEventListener('controllerchange', () => {
    console.log('[Service Worker] Nouveau Service Worker activé');
});