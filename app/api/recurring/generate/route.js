import { prisma } from "../../../../lib/db";
import { requireAdmin, unauthorized } from "../../../../lib/admin";
import { ymdToUTC, weekdayOf } from "../../../../lib/dates";
import { shapeRequest } from "../../../../lib/serialize";
import { durationFrom } from "../../../../lib/time";

export const dynamic = "force-dynamic";
const INCLUDE = { driver: true, vehicle: true };

// Materialize active recurring templates (matching the date's weekday) into
// DispatchRequests. Idempotent: skips templates already generated for that date.
export async function POST(request) {
  if (!requireAdmin(request)) return unauthorized();
  try {
    const b = await request.json();
    if (!b.date) return Response.json({ error: "date required" }, { status: 400 });
    const dow = weekdayOf(b.date);
    const serviceDate = ymdToUTC(b.date);

    const templates = await prisma.recurringTemplate.findMany({ where: { active: true } });
    const matching = templates.filter((t) => (t.daysOfWeek || []).includes(dow));

    const created = [];
    let skipped = 0;
    for (const t of matching) {
      const existing = await prisma.dispatchRequest.findFirst({
        where: { templateId: t.id, serviceDate },
      });
      if (existing) {
        skipped++;
        continue;
      }
      const row = await prisma.dispatchRequest.create({
        data: {
          requesterName: `Standing: ${t.label}`,
          serviceDate,
          timeNeeded: t.defaultTime,
          endTime: t.defaultEndTime || null,
          estDurationMin: t.defaultEndTime ? durationFrom(t.defaultTime, t.defaultEndTime, 60) : 60,
          scheduledTime: t.defaultTime,
          type: t.type,
          pickupLocation: t.pickupLocation,
          destination: t.destination,
          passengers: t.passengers || [],
          driverId: t.defaultDriverId || null,
          vehicleId: t.defaultVehicleId || null,
          status: t.defaultDriverId ? "ASSIGNED" : "REQUESTED",
          templateId: t.id,
        },
        include: INCLUDE,
      });
      created.push(shapeRequest(row));
    }
    return Response.json({ created, createdCount: created.length, skipped });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
