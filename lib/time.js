import { toMinutes } from "./conflicts";

export function minToHHMM(m) {
  m = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// Duration (minutes) implied by an optional end time; falls back to a default.
export function durationFrom(startHHMM, endHHMM, fallback = 60) {
  const s = toMinutes(startHHMM);
  const e = toMinutes(endHHMM);
  if (s == null || e == null) return fallback;
  const d = e - s;
  return d > 0 ? d : fallback;
}

export function endOf(startHHMM, durationMin) {
  const s = toMinutes(startHHMM);
  if (s == null) return null;
  return minToHHMM(s + (durationMin || 60));
}

// "08:00–09:30" using start + duration (always consistent after reschedule).
export function fmtRange(startHHMM, durationMin) {
  const e = endOf(startHHMM, durationMin);
  return e ? `${startHHMM}–${e}` : startHHMM || "—";
}

export function durationLabel(min) {
  if (min >= 480) return "Whole day";
  if (min >= 240) return "Half day";
  if (min <= 60) return "Quick trip";
  return `${Math.round((min / 60) * 10) / 10}h`;
}
