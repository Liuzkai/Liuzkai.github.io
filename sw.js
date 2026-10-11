// Retire the legacy Chirpy cache-first worker. Do not intercept new requests.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith('chirpy-')) await caches.delete(name);
  await self.clients.claim();
  await self.registration.unregister();
  for (const client of await self.clients.matchAll({type: 'window'})) client.navigate(client.url);
})()));
