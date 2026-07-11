import { prisma } from "../../../lib/db";
import { ymdToUTC, addDaysYMD, utcToYMD } from "../../../lib/dates";
import { TYPE_LABEL, STATUS_LABEL } from "../../../lib/constants";

export const dynamic = "force-dynamic";

function csvCell(v) {
  const s = v == null ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const HEADERS = [
  "Date", "Time needed", "Scheduled", "Status", "Type",
  "Requester", "Pickup", "Destination", "Passengers",
  "Driver", "Vehicle", "Purpose", "Equipment", "Notes",
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const where = {};
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from || to) {
      where.serviceDate = {};
      if (from) where.serviceDate.gte = ymdToUTC(from);
      if (to) where.serviceDate.lt = ymdToUTC(addDaysYMD(to, 1));
    }
    if (searchParams.get("driverId")) where.driverId = searchParams.get("driverId");
    if (searchParams.get("vehicleId")) where.vehicleId = searchParams.get("vehicleId");
    if (searchParams.get("status")) where.status = searchParams.get("status");
    const q = (searchParams.get("q") || "").trim();
    if (q) {
      where.OR = [
        { pickupLocation: { contains: q, mode: "insensitive" } },
        { destination: { contains: q, mode: "insensitive" } },
        { purpose: { contains: q, mode: "insensitive" } },
        { requesterName: { contains: q, mode: "insensitive" } },
      ];
    }

    const rows = await prisma.dispatchRequest.findMany({
      where,
      include: { driver: true, vehicle: true },
      orderBy: [{ serviceDate: "asc" }, { scheduledTime: "asc" }, { timeNeeded: "asc" }],
      take: 5000,
    });

    const lines = [HEADERS.join(",")];
    for (const r of rows) {
      lines.push(
        [
          utcToYMD(r.serviceDate),
          r.timeNeeded || "",
          r.scheduledTime || "",
          STATUS_LABEL[r.status] || r.status,
          TYPE_LABEL[r.type] || r.type,
          r.requesterName,
          r.pickupLocation,
          r.destination,
          (r.passengers || []).join("; "),
          r.driver?.name || "",
          r.vehicle?.label || "",
          r.purpose || "",
          r.equipment || "",
          r.notes || "",
        ].map(csvCell).join(",")
      );
    }
    const csv = "﻿" + lines.join("\n"); // BOM so Excel/Sheets read UTF-8

    const stamp = `${from || "all"}_to_${to || "all"}`;
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="dispatch_${stamp}.csv"`,
      },
    });
  } catch (e) {
    return Response.json({ error: String(e.message || e) }, { status: 500 });
  }
}
