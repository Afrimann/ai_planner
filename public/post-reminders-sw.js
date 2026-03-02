/* eslint-disable no-restricted-globals */

// This service worker handles reminder notification clicks and can also
// display push payloads if/when your backend starts sending web push.

self.addEventListener("push", (event) => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || "Scheduled Post Reminder";
  const body = payload.body || "You have scheduled content ready to post.";
  const tag = payload.tag || "post-reminder";
  const url = payload.url || "/posts";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      renotify: false,
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl =
    event.notification?.data?.url && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/posts";

  event.waitUntil(
    (async () => {
      const windowClients = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if ("focus" in client) {
          try {
            const clientUrl = new URL(client.url);
            const destinationUrl = new URL(targetUrl, self.location.origin);

            if (clientUrl.pathname === destinationUrl.pathname) {
              await client.focus();
              return;
            }
          } catch {
            // Ignore URL parse issues and continue to next client.
          }
        }
      }

      if (clients.openWindow) {
        await clients.openWindow(targetUrl);
      }
    })(),
  );
});
