/* JCGG Suite service worker: makes the app installable (so links can be shared to it from YouTube / Facebook).
   It does not cache data; everything still comes live from the network. */
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",()=>{});
