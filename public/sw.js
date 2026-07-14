// DPI Dispatch service worker — PUSH ONLY. Deliberately no fetch handler:
// offline caching is out of scope and a stale cache would hide live dispatch data.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (e) { payload = {}; }
  const title = payload.title || "DPI Dispatch";
  const options = {
    body: payload.body || "",
    tag: payload.tag || undefined,
    icon: "/icon-512.png",
    badge: "/icon-512.png",
    data: { url: payload.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        // an app window is already open — point it at the target and focus it
        if ("focus" in c) { if ("navigate" in c) c.navigate(url); return c.focus(); }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
