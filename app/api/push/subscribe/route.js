import { prisma } from "../../../../lib/db";

export const dynamic = "force-dynamic";

const ROLES = ["dispatcher", "requester", "driver"];

// Accept both a nested { subscription, role } body (from PushToggle) and a flat
// { endpoint, keys, role } body.
function read(b) {
  const sub = b.subscription || b;
  return {
    endpoint: sub.endpoint,
    p256dh: sub.keys && sub.keys.p256dh,
    auth: sub.keys && sub.keys.auth,
    role: b.role,
    personName: b.personName,
  };
}

export async function POST(request) {
  try {
    const { endpoint, p256dh, auth, role, personName } = read(await request.json());
    if (!endpoint || !p256dh || !auth) return Response.json({ error: "invalid subscription" }, { status: 400 });
    if (!ROLES.includes(role)) return Response.json({ error: "invalid role" }, { status: 400 });
    const name = personName ? String(personName).trim().slice(0, 120) || null : null;
    const row = await prisma.pushSubscription.upsert({
      where: { endpoint_role: { endpoint, role } },
      update: { p256dh, auth, personName: name },
      create: { endpoint, p256dh, auth, role, personName: name },
    });
    return Response.json({ ok: true, id: row.id });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { endpoint, role } = read(await request.json());
    if (!endpoint || !role) return Response.json({ error: "endpoint and role required" }, { status: 400 });
    await prisma.pushSubscription.deleteMany({ where: { endpoint, role } });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
