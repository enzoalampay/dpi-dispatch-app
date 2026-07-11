import { utcToYMD } from "./dates";

// Flatten a Prisma DispatchRequest (with driver + vehicle included) for the client.
export function shapeRequest(r) {
  return {
    id: r.id,
    requesterName: r.requesterName,
    serviceDate: utcToYMD(r.serviceDate),
    timeNeeded: r.timeNeeded,
    endTime: r.endTime || null,
    type: r.type,
    pickupLocation: r.pickupLocation,
    destination: r.destination,
    passengers: r.passengers || [],
    purpose: r.purpose || "",
    equipment: r.equipment || "",
    notes: r.notes || "",
    driverId: r.driverId || null,
    driverName: r.driver?.name || null,
    vehicleId: r.vehicleId || null,
    vehicleLabel: r.vehicle?.label || null,
    scheduledTime: r.scheduledTime || null,
    sequence: r.sequence ?? null,
    estDurationMin: r.estDurationMin ?? 60,
    status: r.status,
    templateId: r.templateId || null,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}
