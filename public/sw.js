const CACHE_NAME = 'tripfarecalc-shell-v2';

function getBasePathFromSwLocation() {
	const pathname = self.location.pathname.replace(/\/sw\.js$/, '');
	return pathname || '/';
}

function getPrecacheUrls() {
	const origin = self.location.origin;
	const basePath = getBasePathFromSwLocation();
	const entryUrl = `${origin}${basePath}`;
	return [
		entryUrl,
		`${origin}${basePath}/manifest.webmanifest`,
		`${origin}${basePath}/icons/icon192.png`,
		`${origin}${basePath}/icons/icon512.png`,
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
