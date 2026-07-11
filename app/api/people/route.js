import { prisma } from "../../../lib/db";
import { requireAdmin, unauthorized } from "../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const driversOnly = searchParams.get("drivers") === "1";
    const includeInactive = searchParams.get("all") === "1";
    const where = {};
    if (driversOnly) where.isDriver = true;
    if (!includeInactive) where.active = true;
    const people = await prisma.person.findMany({ where, orderBy: { name: "asc" } });
    return Response.json({ people });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.name || !b.name.trim()) return Response.json({ error: "Name is required" }, { status: 400 });
    const isDriver = !!b.isDriver;
    const token = isDriver
      ? `${b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(16).slice(2, 8)}`
      : null;
    const person = await prisma.person.create({
      data: {
        name: b.name.trim(),
        phone: b.phone || null,
        email: b.email || null,
        isDriver,
        isAdmin: !!b.isAdmin,
        active: true,
        driverToken: token,
      },
    });
    return Response.json({ person });
  } catch (e) {
    if (String(e).includes("Unique")) return Response.json({ error: "That name already exists" }, { status: 409 });
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.id) return Response.json({ error: "id required" }, { status: 400 });
    const data = {};
    for (const k of ["name", "phone", "email", "isDriver", "isAdmin", "active"]) {
      if (k in b) data[k] = b[k];
    }
    // ensure a driver has a token
    if (data.isDriver) {
      const existing = await prisma.person.findUnique({ where: { id: b.id } });
      if (existing && !existing.driverToken) {
        data.driverToken = `${(data.name || existing.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(16).slice(2, 8)}`;
      }
    }
    const person = await prisma.person.update({ where: { id: b.id }, data });
    return Response.json({ person });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
