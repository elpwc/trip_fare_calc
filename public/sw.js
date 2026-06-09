const CACHE_NAME = 'tripfarecalc-shell-v1';

function getPrecacheUrls() {
	const root = new URL('./', self.location);
	return [
		root.href,
		new URL('manifest.webmanifest', self.location).href,
		new URL('icons/icon192.png', self.location).href,
		new URL('icons/icon512.png', self.location).href,
	];
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(getPrecacheUrls()))
			.then(() => self.skipWaiting())
			.catch(() => self.skipWaiting()),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
			.then(() => self.clients.claim()),
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) return cached;
			return fetch(event.request);
		}),
	);
});
