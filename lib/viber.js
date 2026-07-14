// Build a Viber-ready dispatch message + deep link. No Viber API account needed —
// the deep link opens Viber's share sheet with the text pre-filled.

import { TYPE_LABEL } from "./constants";

export function buildDriverMessage({ driverName, dateLabel, trips, driverUrl }) {
  const lines = (trips || []).map((t, i) => {
    const time = t.scheduledTime || t.timeNeeded || "";
    const pax = (t.passengers || []).join(", ");
    const who = pax ? `pick up ${pax}` : "trip";
    const type = t.type ? ` [${TYPE_LABEL[t.type] || t.type}]` : "";
    return `${i + 1}. ${time} — ${who} @ ${t.pickupLocation} → ${t.destination}${type}`;
  });
  const header = `Dispatch ${dateLabel} — ${driverName}`;
  const body = lines.length ? lines.join("\n") : "No trips assigned.";
  const footer = driverUrl ? `\n\nYour schedule: ${driverUrl}` : "";
  return `${header}\n${body}${footer}`;
}

// Requester → dispatcher alert. Precomputed from the submitted form so the
// requester can paste it into the dispatcher's Viber chat with one tap.
export function buildRequesterMessage({ requesterName, dateLabel, timeNeeded, endTime, type, pickupLocation, destination, passengers, purpose, baseUrl }) {
  const when = endTime ? `${timeNeeded}–${endTime}` : timeNeeded;
  const pax = (passengers || []).filter(Boolean).join(", ");
  const lines = [
    "🚗 New transport request",
    `From: ${requesterName}`,
    `${dateLabel} · ${when}`,
    `Pickup: ${pickupLocation}`,
    `Drop-off: ${destination}`,
  ];
  if (type) lines.push(`For: ${TYPE_LABEL[type] || type}`);
  if (pax) lines.push(`Passengers: ${pax}`);
  if (purpose) lines.push(`Purpose: ${purpose}`);
  if (baseUrl) lines.push(`Assign here: ${baseUrl}/dispatch`);
  return lines.join("\n");
}

export function viberDeepLink(text) {
  return `viber://forward?text=${encodeURIComponent(text)}`;
}
