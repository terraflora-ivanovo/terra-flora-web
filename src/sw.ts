/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { clientsClaim } from "workbox-core";
import { NavigationRoute, registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";

declare let self: ServiceWorkerGlobalScope;

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);
clientsClaim();

registerRoute(
  ({ request }) => request.destination === "image",
  new CacheFirst({ cacheName: "flora-images" }),
);

registerRoute(
  ({ url }) => url.pathname.includes("/rest/v1/"),
  new NetworkFirst({ cacheName: "flora-api", networkTimeoutSeconds: 5 }),
);

registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "flora-pages",
      networkTimeoutSeconds: 4,
    }),
  ),
);

self.addEventListener("push", (event) => {
  const data = (() => {
    try {
      return event.data?.json() as { title?: string; body?: string };
    } catch {
      return { title: "Новый заказ", body: event.data?.text() ?? "" };
    }
  })();

  event.waitUntil(
    self.registration.showNotification(data.title ?? "Новый заказ", {
      body: data.body ?? "Откройте кабинет, чтобы посмотреть детали",
      icon: "/favicon.ico",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow("/"));
});
