// GiantChrono service worker (PWA-003..PWA-005).
//
// Strategy: precache every asset on install (full offline from the first
// visit, PWA-004), then serve GET requests network-first at runtime — fresh
// content whenever online, cache fallback when offline. Asset URLs are
// resolved against the registration scope, so the same build works at any
// deployment path (domain root or subdirectory).

// Injected by scripts/build.ts (BLD-004).
declare const __PRECACHE__: string[];
declare const __VERSION__: string;

// The DOM and WebWorker TypeScript libs conflict, so the service worker
// global is typed locally with just what this file uses.
interface ExtendableEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}
interface FetchEventLike extends ExtendableEvent {
  request: Request;
  respondWith(response: Promise<Response> | Response): void;
}
interface MessageEventLike extends Event {
  data: unknown;
}
interface ServiceWorkerGlobal {
  registration: { scope: string };
  location: { origin: string };
  skipWaiting(): Promise<void>;
  clients: { claim(): Promise<void> };
  addEventListener(type: "install" | "activate", listener: (event: ExtendableEvent) => void): void;
  addEventListener(type: "fetch", listener: (event: FetchEventLike) => void): void;
  addEventListener(type: "message", listener: (event: MessageEventLike) => void): void;
}
const sw = self as unknown as ServiceWorkerGlobal;

const CACHE_PREFIX = "giantchrono-";
const CACHE_NAME = `${CACHE_PREFIX}${__VERSION__}`;

/** Resolve a precache entry ("" = app shell) against the registration scope. */
const scoped = (path: string): string => new URL(path, sw.registration.scope).toString();

sw.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // cache: "reload" bypasses the HTTP cache so the new version is real (PWA-005).
      await cache.addAll(__PRECACHE__.map((p) => new Request(scoped(p), { cache: "reload" })));
    })(),
  );
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((n) => n.startsWith(CACHE_PREFIX) && n !== CACHE_NAME)
          .map((n) => caches.delete(n)),
      );
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener("message", (event) => {
  if ((event.data as { type?: string } | null)?.type === "SKIP_WAITING") {
    void sw.skipWaiting();
  }
});

async function networkFirst(request: Request): Promise<Response> {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
    if (cached) return cached;
    if (request.mode === "navigate") {
      // Offline navigation falls back to the cached app shell (PWA-004).
      const shell = (await cache.match(scoped(""))) ?? (await cache.match(scoped("index.html")));
      if (shell) return shell;
    }
    return new Response("Offline", { status: 503, statusText: "Service Unavailable" });
  }
}

sw.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  // Same-origin only; the app makes no cross-origin requests anyway (PWA-006).
  if (new URL(request.url).origin !== sw.location.origin) return;
  event.respondWith(networkFirst(request));
});
