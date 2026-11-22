// Service worker mínimo de Allocia. Solo atiende el toque sobre un aviso del navegador: enfoca la pestaña
// abierta de Allocia (o abre una) en la pantalla de Alertas. No intercepta pedidos ni usa caché.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const wanted = event.notification.data && event.notification.data.url;
  // Solo rutas internas, como safeNext en el login.
  const path = typeof wanted === "string" && wanted.startsWith("/") && !wanted.startsWith("//") ? wanted : "/market";
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const open = windows.find((client) => new URL(client.url).origin === self.location.origin);
      if (open) {
        await open.focus();
        if ("navigate" in open) await open.navigate(path).catch(() => undefined);
        return;
      }
      await self.clients.openWindow(path);
    })(),
  );
});
