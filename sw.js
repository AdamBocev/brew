/* Bump CACHE on every deploy so clients pick up the new build. */
const CACHE = "brew-v5";
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./fonts/instrument-sans-latin.woff2",
  "./icons/icon.svg",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];
/* How long opening the app waits on the network before showing the cached
   copy. The network answer still refreshes the cache for next time. */
const NAV_TIMEOUT = 3000;

self.addEventListener("install", (e) => {
  // cache: "reload" skips the browser's HTTP cache (GitHub Pages sends
  // max-age=600), so a new version never precaches the previous build.
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: "reload" }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Only a successful response replaces the cached copy, so a 404 or a Pages
// outage can't overwrite the good offline version. A failed response falls
// back to the cache when there is something there.
function fromNetwork(e, req, init) {
  return fetch(req, init).then((res) => {
    // A navigation fetched this way keeps redirect: "manual"; hand any
    // redirect back to the browser to follow instead of treating it as a
    // failure (it would otherwise pin installed copies to the cache if the
    // site ever moved).
    if (res.type === "opaqueredirect") return res;
    if (res.ok) {
      const copy = res.clone();
      e.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
      return res;
    }
    return caches.match(req).then((hit) => hit || res);
  });
}

function cachedPage(req) {
  return caches.match(req).then((hit) => hit || caches.match("./index.html"));
}

// Opening the app: network-first, revalidated against the server (no-cache
// still gets a cheap 304 when nothing changed), but never more than
// NAV_TIMEOUT on a weak connection when a cached copy exists.
function navigate(e) {
  const req = e.request;
  const net = fromNetwork(e, req, { cache: "no-cache" });
  e.waitUntil(net.catch(() => {}));
  return new Promise((resolve) => {
    let settled = false;
    const take = (res) => { if (res && !settled) { settled = true; resolve(res); } };
    const timer = setTimeout(() => cachedPage(req).then(take, () => {}), NAV_TIMEOUT);
    net.then(
      (res) => { clearTimeout(timer); take(res); },
      () => {
        clearTimeout(timer);
        cachedPage(req).catch(() => null).then((hit) => take(hit || Response.error()));
      }
    );
  });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(navigate(e));
    return;
  }

  // The font never changes between deploys and is re-precached on every
  // CACHE bump, so serve it from the cache: a connection that is up but
  // passing no traffic would otherwise hold the font (and a late reflow of
  // the big numerals) for as long as the network takes to give up.
  if (req.destination === "font") {
    e.respondWith(
      caches.match(req).then((hit) => hit || fromNetwork(e, req)).catch(() => Response.error())
    );
    return;
  }

  // Everything else (icons, manifest): network-first, cache as fallback.
  e.respondWith(
    fromNetwork(e, req).catch(() => caches.match(req).then((hit) => hit || Response.error()))
  );
});
