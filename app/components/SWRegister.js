"use client";
import { useEffect } from "react";

// Registers the push-only service worker once on the client. Mounted in the
// root layout so every page can receive notifications.
export default function SWRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
