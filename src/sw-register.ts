// Service worker registration and update flow (PWA-003, PWA-005).

/** Register the service worker; call `onUpdateReady` when a new version waits. */
export function registerServiceWorker(onUpdateReady: (apply: () => void) => void): void {
  // The bundler inlines NODE_ENV: registration only happens in production
  // builds; the dev server (BLD-002) runs without a service worker.
  if (process.env.NODE_ENV !== "production") return;
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    void (async () => {
      try {
        // Relative path so the app works from any base path (domain root or
        // a subdirectory such as GitHub Pages project sites).
        const registration = await navigator.serviceWorker.register("sw.js");

        const promote = (worker: ServiceWorker | null) => {
          if (!worker) return;
          // Only prompt when an old version is already controlling the page;
          // the very first install activates silently.
          if (!navigator.serviceWorker.controller) return;
          onUpdateReady(() => worker.postMessage({ type: "SKIP_WAITING" }));
        };

        promote(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          installing?.addEventListener("statechange", () => {
            if (installing.state === "installed") promote(installing);
          });
        });

        // Reload once the new worker takes control (PWA-005); persisted data
        // in localStorage is untouched by the swap.
        let reloading = false;
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (reloading) return;
          reloading = true;
          location.reload();
        });
      } catch {
        // Registration failure must never block the app (offline-first is a
        // progressive enhancement at first visit).
      }
    })();
  });
}
