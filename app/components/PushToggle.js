"use client";
import { useEffect, useState } from "react";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const ROLES_KEY = "dispatch_push_roles"; // roles this device has enrolled (matches app localStorage idiom)

// VAPID public key (base64url) → Uint8Array for pushManager.subscribe.
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function getRoles() {
  try { return JSON.parse(localStorage.getItem(ROLES_KEY) || "[]"); } catch { return []; }
}
function saveRoles(roles) {
  try { localStorage.setItem(ROLES_KEY, JSON.stringify([...new Set(roles)])); } catch {}
}

// Bell toggle. One endpoint can enrol several roles (dispatcher + requester),
// so turning off only removes this role's row — the browser subscription stays
// alive for any other roles enrolled on this device.
export default function PushToggle({ role, personName, label }) {
  const [supported, setSupported] = useState(false);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [denied, setDenied] = useState(false);
  const [on, setOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const hasSW = "serviceWorker" in navigator;
    const hasPush = typeof window !== "undefined" && "PushManager" in window;
    if (!hasSW || !hasPush || !PUB) return; // supported stays false → renders nothing
    setSupported(true);
    const isiOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    const standalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone;
    if (isiOS && !standalone) setNeedsInstall(true); // iOS needs the PWA installed to subscribe
    if (typeof Notification !== "undefined" && Notification.permission === "denied") setDenied(true);
    setOn(getRoles().includes(role));
  }, [role]);

  async function enable() {
    setBusy(true); setMsg("");
    try {
      // iOS gesture rule: requestPermission is the first await in this tap — nothing awaits before it.
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { setDenied(perm === "denied"); setBusy(false); return; }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(PUB),
        });
      }
      const r = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub.toJSON(), role, personName: personName || null }),
      });
      if (!r.ok) throw new Error();
      saveRoles([...getRoles(), role]);
      setOn(true);
    } catch {
      setMsg("Couldn't turn on notifications.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true); setMsg("");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint, role }),
        });
      }
      saveRoles(getRoles().filter((x) => x !== role));
      setOn(false);
    } catch {
      setMsg("Couldn't turn off notifications.");
    } finally {
      setBusy(false);
    }
  }

  function onToggle() { if (on) disable(); else enable(); }

  if (!supported) return null;

  return (
    <div className="push-toggle">
      <span className="bell">🔔</span>
      <span className="lbl">{label}</span>
      {needsInstall ? (
        <span className="push-hint">Add to Home Screen first</span>
      ) : denied ? (
        <span className="push-hint">Blocked in browser settings</span>
      ) : (
        <button className={`btn btn-sm ${on ? "btn-primary" : ""}`} onClick={onToggle} disabled={busy}>
          {busy ? "…" : on ? "On ✓" : "Turn on"}
        </button>
      )}
      {msg && <span className="push-hint" style={{ flexBasis: "100%" }}>{msg}</span>}
    </div>
  );
}
