
const CACHE_NAME = "bizlead-shell-v1";

const SHELL_FILES = [
    "/",
    "/static/manifest.json",
    "/static/style.css",
    "/static/app.js",
    "/static/icons/bizlead-192.png",
    "/static/icons/bizlead-512.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(SHELL_FILES))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames
                        .filter(
                            (name) =>
                                name.startsWith("bizlead-shell-") &&
                                name !== CACHE_NAME
                        )
                        .map((name) => caches.delete(name))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const request = event.request;
    const url = new URL(request.url);

    // Never intercept non-GET requests or cross-origin requests.
    if (request.method !== "GET" || url.origin !== self.location.origin) {
        return;
    }

    // Never cache API responses or enquiry data.
    if (url.pathname.startsWith("/api/")) {
        return;
    }

    // Use the network first for page navigation.
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async () => {
                const cachedPage = await caches.match("/");
                return cachedPage || Response.error();
            })
        );
        return;
    }

    // Use cached copies of the app's static files when available.
    if (url.pathname.startsWith("/static/")) {
        event.respondWith(
            caches.match(request).then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request).then((response) => {
                    if (response.ok && response.type === "basic") {
                        const responseCopy = response.clone();
                        caches.open(CACHE_NAME).then((cache) =>
                            cache.put(request, responseCopy)
                        );
                    }

                    return response;
                });
            })
        );
    }
});
