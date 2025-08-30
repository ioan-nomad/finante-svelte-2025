// Service Worker for Finanțe App PWA
const CACHE_NAME = 'finante-app-v1.0.0';
const STATIC_CACHE = 'finante-static-v1.0.0';
const DYNAMIC_CACHE = 'finante-dynamic-v1.0.0';

// Resources to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  // Add your main app assets here
];

// Routes that should be cached
const CACHEABLE_ROUTES = [
  '/',
  '/index.html'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
  );
  
  // Ensure the service worker takes control immediately
  self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  // Handle different types of requests
  if (STATIC_ASSETS.includes(url.pathname)) {
    // Static assets - cache first
    event.respondWith(cacheFirst(request));
  } else if (CACHEABLE_ROUTES.some(route => url.pathname.startsWith(route))) {
    // App routes - network first with cache fallback
    event.respondWith(networkFirst(request));
  } else if (request.destination === 'image') {
    // Images - cache first with network fallback
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
  } else {
    // Everything else - network only
    event.respondWith(fetch(request));
  }
});

// Cache-first strategy
async function cacheFirst(request, cacheName = STATIC_CACHE) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Serving from cache:', request.url);
      return cachedResponse;
    }
    
    console.log('Fetching and caching:', request.url);
    const response = await fetch(request);
    
    if (response.status === 200) {
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.error('Cache-first failed:', error);
    
    // Return offline fallback if available
    if (request.destination === 'document') {
      const cache = await caches.open(STATIC_CACHE);
      return await cache.match('/') || new Response('Offline');
    }
    
    throw error;
  }
}

// Network-first strategy
async function networkFirst(request, cacheName = DYNAMIC_CACHE) {
  try {
    console.log('Network first:', request.url);
    const response = await fetch(request);
    
    if (response.status === 200) {
      const cache = await caches.open(cacheName);
      const responseClone = response.clone();
      await cache.put(request, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('Network failed, trying cache:', request.url);
    
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const staticCache = await caches.open(STATIC_CACHE);
      return await staticCache.match('/') || 
             new Response('App is offline', { 
               status: 200, 
               headers: { 'Content-Type': 'text/html' } 
             });
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Sync offline transactions when back online
async function syncTransactions() {
  try {
    // Get pending transactions from IndexedDB
    const pendingTransactions = await getPendingTransactions();
    
    if (pendingTransactions.length > 0) {
      console.log(`Syncing ${pendingTransactions.length} offline transactions`);
      
      // Process each pending transaction
      for (const transaction of pendingTransactions) {
        try {
          // Send to server or process locally
          await processTransaction(transaction);
          await removePendingTransaction(transaction.id);
        } catch (error) {
          console.error('Failed to sync transaction:', error);
        }
      }
      
      // Notify clients about successful sync
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'TRANSACTIONS_SYNCED',
            count: pendingTransactions.length
          });
        });
      });
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Notificare nouă din FinanțeApp',
    icon: '/icon-192.png',
    badge: '/icon-96.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    },
    actions: [
      {
        action: 'open',
        title: 'Deschide App'
      },
      {
        action: 'close',
        title: 'Închide'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FinanțeApp', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          // Focus existing window if available
          for (const client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          
          // Open new window if none exists
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Message handling for communication with main app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_TRANSACTION':
      cacheTransactionOffline(payload);
      break;
      
    case 'GET_CACHE_STATUS':
      getCacheStatus().then(status => {
        event.ports[0].postMessage(status);
      });
      break;
      
    default:
      console.log('Unknown message type:', type);
  }
});

// Helper functions for offline functionality
async function getPendingTransactions() {
  // Implementation depends on your offline storage strategy
  // This could use IndexedDB to store pending transactions
  return [];
}

async function removePendingTransaction(id) {
  // Remove transaction from IndexedDB after successful sync
  console.log('Removing synced transaction:', id);
}

async function processTransaction(transaction) {
  // Process the transaction (could be API call or local storage update)
  console.log('Processing transaction:', transaction);
}

async function cacheTransactionOffline(transaction) {
  // Store transaction for later sync when online
  console.log('Caching transaction for offline:', transaction);
}

async function getCacheStatus() {
  const cacheNames = await caches.keys();
  const status = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    status[cacheName] = keys.length;
  }
  
  return status;
}

console.log('Service Worker loaded successfully');