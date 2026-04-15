const CACHE = 'csv-grid-v1'

const PRECACHE = [
  '/',
  '/datagridxl.js',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only handle same-origin GET requests
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request)
      const fetchPromise = fetch(event.request)
        .then((response) => {
          if (response.ok) cache.put(event.request, response.clone())
          return response
        })
        .catch(() => cached ?? new Response('Offline', { status: 503 }))
      // Return cached immediately if available, fetch in background to refresh
      return cached ?? fetchPromise
    })
  )
})
