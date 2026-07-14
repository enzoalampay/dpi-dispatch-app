// Server-side Web Push. Free (no external service): the browser's push service
// delivers notifications; we only sign the request with VAPID keys.
import webpush from "web-push";
import { prisma } from "./db";

const PUB = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const PRIV = process.env.VAPID_PRIVATE_KEY;
let configured = false;

// No-ops when the VAPID keys are absent (e.g. a local env without them) so
// dispatch operations never depend on push being set up.
export function pushEnabled() {
  return !!(PUB && PRIV);
}

function ensureConfigured() {
  if (configured || !pushEnabled()) return;
  webpush.setVapidDetails("mailto:enzo.alampay@digiscriptinc.com", PUB, PRIV);
  configured = true;
}

// Send `payload` to every subscription, then prune the ones the push service
// reports as dead (401/403 auth, 404/410 gone). Failures never throw upward.
export async function sendToSubs(subs, payload) {
  if (!pushEnabled() || !subs || subs.length === 0) return;
  ensureConfigured();
  const body = JSON.stringify(payload);
  const results = await Promise.allSettled(
    subs.map((s) =>
      webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, body)
    )
  );
  const dead = [];
  results.forEach((r, i) => {
    if (r.status === "rejected") {
      const code = r.reason && r.reason.statusCode;
      if (code === 401 || code === 403 || code === 404 || code === 410) dead.push(subs[i].id);
    }
  });
  if (dead.length) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: dead } } });
  }
}

export async function notifyDispatchers(payload) {
  if (!pushEnabled()) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { role: "dispatcher" } });
    await sendToSubs(subs, payload);
  } catch (e) { /* notify is best-effort — never break the operation */ }
}

export async function notifyRequester(name, payload) {
  if (!pushEnabled() || !name) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { role: "requester", personName: name } });
    await sendToSubs(subs, payload);
  } catch (e) { /* best-effort */ }
}

export async function notifyDriver(name, payload) {
  if (!pushEnabled() || !name) return;
  try {
    const subs = await prisma.pushSubscription.findMany({ where: { role: "driver", personName: name } });
    await sendToSubs(subs, payload);
  } catch (e) { /* best-effort */ }
}
