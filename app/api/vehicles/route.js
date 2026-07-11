import { prisma } from "../../../lib/db";
import { requireAdmin, unauthorized } from "../../../lib/admin";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "1";
    const where = includeInactive ? {} : { active: true };
    const vehicles = await prisma.vehicle.findMany({ where, orderBy: { label: "asc" } });
    return Response.json({ vehicles });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.label || !b.label.trim()) return Response.json({ error: "Label is required" }, { status: 400 });
    const vehicle = await prisma.vehicle.create({
      data: {
        label: b.label.trim(),
        plate: b.plate || null,
        type: b.type || null,
        capacity: b.capacity ? parseInt(b.capacity, 10) : null,
        active: true,
      },
    });
    return Response.json({ vehicle });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.id) return Response.json({ error: "id required" }, { status: 400 });
    const data = {};
    for (const k of ["label", "plate", "type", "active"]) if (k in b) data[k] = b[k];
    if ("capacity" in b) data.capacity = b.capacity ? parseInt(b.capacity, 10) : null;
    const vehicle = await prisma.vehicle.update({ where: { id: b.id }, data });
    return Response.json({ vehicle });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
