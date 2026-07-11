// Time-overlap conflict detection for driver/vehicle double-booking.

export function toMinutes(hhmm) {
  if (!hhmm || typeof hhmm !== "string" || !hhmm.includes(":")) return null;
  const [h, m] = hhmm.split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

export function overlaps(aStart, aDur, bStart, bDur) {
  const aEnd = aStart + (aDur || 60);
  const bEnd = bStart + (bDur || 60);
  return aStart < bEnd && bStart < aEnd;
}

// trips: existing assigned requests for the same driver (or vehicle) on the same date.
// Returns the subset that overlaps the proposed [scheduledTime, +estDurationMin] window.
export function findConflicts({ trips, scheduledTime, estDurationMin, ignoreId }) {
  const start = toMinutes(scheduledTime);
  if (start == null) return [];
  return (trips || []).filter((t) => {
    if (t.id === ignoreId) return false;
    if (t.status === "CANCELLED") return false;
    const bStart = toMinutes(t.scheduledTime);
    if (bStart == null) return false;
    return overlaps(start, estDurationMin, bStart, t.estDurationMin);
  });
}
