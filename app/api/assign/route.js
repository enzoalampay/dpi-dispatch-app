import { prisma } from "../../../lib/db";
import { requireAdmin, unauthorized } from "../../../lib/admin";
import { findConflicts } from "../../../lib/conflicts";
import { shapeRequest } from "../../../lib/serialize";

export const dynamic = "force-dynamic";
const INCLUDE = { driver: true, vehicle: true };

export async function POST(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.id) return Response.json({ error: "id required" }, { status: 400 });

    const current = await prisma.dispatchRequest.findUnique({ where: { id: b.id } });
    if (!current) return Response.json({ error: "Request not found" }, { status: 404 });

    const driverId = b.driverId || null;
    const vehicleId = b.vehicleId || null;
    const scheduledTime = b.scheduledTime || current.timeNeeded || null;
    const estDurationMin = b.estDurationMin ? parseInt(b.estDurationMin, 10) : current.estDurationMin || 60;

    // gather same-day trips for conflict detection
    let driverConflicts = [];
    let vehicleConflicts = [];
    if (driverId && scheduledTime) {
      const trips = await prisma.dispatchRequest.findMany({
        where: { driverId, serviceDate: current.serviceDate, NOT: { id: b.id } },
        include: INCLUDE,
      });
      driverConflicts = findConflicts({ trips, scheduledTime, estDurationMin, ignoreId: b.id }).map(shapeRequest);
    }
    if (vehicleId && scheduledTime) {
      const trips = await prisma.dispatchRequest.findMany({
        where: { vehicleId, serviceDate: current.serviceDate, NOT: { id: b.id } },
        include: INCLUDE,
      });
      vehicleConflicts = findConflicts({ trips, scheduledTime, estDurationMin, ignoreId: b.id }).map(shapeRequest);
    }

    if (!b.force && (driverConflicts.length || vehicleConflicts.length)) {
      return Response.json(
        { conflict: true, driverConflicts, vehicleConflicts },
        { status: 409 }
      );
    }

    const nextStatus = current.status === "REQUESTED" ? "ASSIGNED" : current.status;
    const row = await prisma.dispatchRequest.update({
      where: { id: b.id },
      data: {
        driverId,
        vehicleId,
        scheduledTime,
        estDurationMin,
        sequence: b.sequence != null ? parseInt(b.sequence, 10) : current.sequence,
        status: driverId ? nextStatus : "REQUESTED",
      },
      include: INCLUDE,
    });
    return Response.json({ request: shapeRequest(row), forced: !!b.force });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
