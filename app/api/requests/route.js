import { prisma } from "../../../lib/db";
import { ymdToUTC, addDaysYMD } from "../../../lib/dates";
import { shapeRequest } from "../../../lib/serialize";
import { durationFrom } from "../../../lib/time";

export const dynamic = "force-dynamic";

const INCLUDE = { driver: true, vehicle: true };

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const where = {};

    const date = searchParams.get("date");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (date) {
      where.serviceDate = ymdToUTC(date);
    } else if (from || to) {
      where.serviceDate = {};
      if (from) where.serviceDate.gte = ymdToUTC(from);
      if (to) where.serviceDate.lt = ymdToUTC(addDaysYMD(to, 1));
    }

    const requester = searchParams.get("requester");
    if (requester) where.requesterName = requester;

    const driverId = searchParams.get("driverId");
    if (driverId) where.driverId = driverId;

    const vehicleId = searchParams.get("vehicleId");
    if (vehicleId) where.vehicleId = vehicleId;

    const status = searchParams.get("status");
    if (status) where.status = status;

    if (searchParams.get("unassigned") === "1") where.driverId = null;

    const q = (searchParams.get("q") || "").trim();
    if (q) {
      where.OR = [
        { pickupLocation: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
        { purpose: { contains: q, mode: "insensitive" } },
        { requesterName: { contains: q, mode: "insensitive" } },
      ];
    }

    const limit = Math.min(parseInt(searchParams.get("limit") || "500", 10), 2000);
    const rows = await prisma.dispatchRequest.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ serviceDate: "desc" }, { scheduledTime: "asc" }, { timeNeeded: "asc" }, { createdAt: "asc" }],
      take: limit,
    });
    return Response.json({ requests: rows.map(shapeRequest) });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const b = await request.json();
    const required = ["requesterName", "serviceDate", "timeNeeded", "pickupLocation", "destination"];
    for (const k of required) {
      if (!b[k] || !String(b[k]).trim()) return Response.json({ error: `${k} is required` }, { status: 400 });
    }
    const endTime = b.endTime && b.endTime.trim() ? b.endTime.trim() : null;
    const est = endTime ? durationFrom(b.timeNeeded, endTime, 60) : b.estDurationMin || 60;
    const row = await prisma.dispatchRequest.create({
      data: {
        requesterName: b.requesterName.trim(),
        serviceDate: ymdToUTC(b.serviceDate),
        timeNeeded: b.timeNeeded,
        endTime,
        estDurationMin: est,
        type: b.type || "OTHER",
        pickupLocation: b.pickupLocation.trim(),
        destination: b.destination.trim(),
        passengers: Array.isArray(b.passengers) ? b.passengers : [],
        purpose: b.purpose || null,
        equipment: b.equipment || null,
        notes: b.notes || null,
        status: "REQUESTED",
      },
      include: INCLUDE,
    });
    return Response.json({ request: shapeRequest(row) });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const b = await request.json();
    if (!b.id) return Response.json({ error: "id required" }, { status: 400 });
    const data = {};
    for (const k of ["requesterName", "timeNeeded", "type", "pickupLocation", "destination", "purpose", "equipment", "notes", "status"]) {
      if (k in b) data[k] = b[k];
    }
    if ("passengers" in b && Array.isArray(b.passengers)) data.passengers = b.passengers;
    if ("endTime" in b) {
      const et = b.endTime && b.endTime.trim() ? b.endTime.trim() : null;
      data.endTime = et;
      if (et && data.timeNeeded) data.estDurationMin = durationFrom(data.timeNeeded, et, 60);
      else if (!et && b.estDurationMin) data.estDurationMin = parseInt(b.estDurationMin, 10);
    }
    if ("serviceDate" in b && b.serviceDate) data.serviceDate = ymdToUTC(b.serviceDate);

    // clearing an assignment resets status back to REQUESTED
    if (b.unassign) {
      data.driverId = null;
      data.vehicleId = null;
      data.scheduledTime = null;
      data.sequence = null;
      data.status = "REQUESTED";
    }

    const row = await prisma.dispatchRequest.update({ where: { id: b.id }, data, include: INCLUDE });
    return Response.json({ request: shapeRequest(row) });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
