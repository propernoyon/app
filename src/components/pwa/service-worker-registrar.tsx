"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (production only).
 *
 * Kept to a single effect with no state: registering a worker is a one-way
 * synchronisation with the browser, not something the UI needs to react to.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
        console.warn("[pwa] service worker registration failed", error);
      });
    };

    // Wait for load so registration never competes with the first paint.
    if (document.readyState === "complete") {
      register();
      return;
    }

    window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
