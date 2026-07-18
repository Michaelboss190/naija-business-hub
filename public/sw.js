const CACHE_NAME = 'naijabizhub-v3'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['/', '/index.html', '/forum', '/resources', '/vendors', '/events'])
    })
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request).then((response) => {
      const responseClone = response.clone()
      caches.open(CACHE_NAME).then((cache) => {
        if (event.request.method === 'GET') cache.put(event.request, responseClone)
      })
      return response
    }).catch(() => {
      return caches.match(event.request).then((response) => {
        return response || new Response('Offline - Please check your connection')
      })
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) return caches.delete(cacheName)
      }))
    })
  )
})