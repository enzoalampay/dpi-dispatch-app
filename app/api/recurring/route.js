import { prisma } from "../../../lib/db";
import { requireAdmin, unauthorized } from "../../../lib/admin";

export const dynamic = "force-dynamic";
const INCLUDE = { defaultDriver: true, defaultVehicle: true };

function shape(t) {
  return {
    id: t.id,
    label: t.label,
    daysOfWeek: t.daysOfWeek || [],
    defaultTime: t.defaultTime,
    defaultEndTime: t.defaultEndTime || null,
    pickupLocation: t.pickupLocation,
    destination: t.destination,
    passengers: t.passengers || [],
    type: t.type,
    active: t.active,
    defaultDriverId: t.defaultDriverId || null,
    defaultDriverName: t.defaultDriver?.name || null,
    defaultVehicleId: t.defaultVehicleId || null,
    defaultVehicleLabel: t.defaultVehicle?.label || null,
  };
}

export async function GET() {
  try {
    const rows = await prisma.recurringTemplate.findMany({ include: INCLUDE, orderBy: { defaultTime: "asc" } });
    return Response.json({ templates: rows.map(shape) });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.label || !b.defaultTime || !b.pickupLocation || !b.destination) {
      return Response.json({ error: "label, defaultTime, pickupLocation, destination are required" }, { status: 400 });
    }
    const row = await prisma.recurringTemplate.create({
      data: {
        label: b.label.trim(),
        daysOfWeek: Array.isArray(b.daysOfWeek) ? b.daysOfWeek : [],
        defaultTime: b.defaultTime,
        defaultEndTime: b.defaultEndTime || null,
        pickupLocation: b.pickupLocation.trim(),
        destination: b.destination.trim(),
        passengers: Array.isArray(b.passengers) ? b.passengers : [],
        type: b.type || "OTHER",
        active: b.active !== false,
        defaultDriverId: b.defaultDriverId || null,
        defaultVehicleId: b.defaultVehicleId || null,
      },
      include: INCLUDE,
    });
    return Response.json({ template: shape(row) });
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
    for (const k of ["label", "defaultTime", "defaultEndTime", "pickupLocation", "destination", "type", "active", "defaultDriverId", "defaultVehicleId"]) {
      if (k in b) data[k] = b[k];
    }
    if ("daysOfWeek" in b && Array.isArray(b.daysOfWeek)) data.daysOfWeek = b.daysOfWeek;
    if ("passengers" in b && Array.isArray(b.passengers)) data.passengers = b.passengers;
    const row = await prisma.recurringTemplate.update({ where: { id: b.id }, data, include: INCLUDE });
    return Response.json({ template: shape(row) });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
