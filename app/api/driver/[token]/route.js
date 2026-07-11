import { prisma } from "../../../../lib/db";
import { ymdToUTC } from "../../../../lib/dates";
import { shapeRequest } from "../../../../lib/serialize";

export const dynamic = "force-dynamic";
const INCLUDE = { driver: true, vehicle: true };

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    const driver = await prisma.person.findUnique({ where: { driverToken: token } });
    if (!driver) return Response.json({ error: "Unknown driver link" }, { status: 404 });

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date");

    const where = { driverId: driver.id, status: { not: "CANCELLED" } };
    if (date) where.serviceDate = ymdToUTC(date);

    const rows = await prisma.dispatchRequest.findMany({
      where,
      include: INCLUDE,
      orderBy: [{ serviceDate: "asc" }, { scheduledTime: "asc" }, { timeNeeded: "asc" }],
      take: 200,
    });

    return Response.json({
      driver: { id: driver.id, name: driver.name },
      trips: rows.map(shapeRequest),
    });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
