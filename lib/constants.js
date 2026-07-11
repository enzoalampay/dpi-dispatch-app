// Shared by client and server. Plain data only.

export const REQUEST_TYPES = [
  { value: "SITE_MOBILIZATION", label: "Site mobilization" },
  { value: "SCANNING", label: "Scanning" },
  { value: "OCULAR", label: "Ocular inspection" },
  { value: "DEMO", label: "Demo" },
  { value: "MEETING", label: "Meeting" },
  { value: "AIRPORT_PICKUP", label: "Airport pickup" },
  { value: "AIRPORT_DROPOFF", label: "Airport dropoff" },
  { value: "EQUIPMENT_PICKUP", label: "Equipment pickup" },
  { value: "EQUIPMENT_DELIVERY", label: "Equipment delivery" },
  { value: "ERRAND", label: "Errand" },
  { value: "OTHER", label: "Other" },
];

export const TYPE_LABEL = Object.fromEntries(REQUEST_TYPES.map((t) => [t.value, t.label]));

// status → label + color token (see globals.css .badge-*) + plain-English help
export const STATUSES = [
  { value: "REQUESTED", label: "Requested", tone: "grey", help: "Waiting for the dispatcher to assign a driver." },
  { value: "ASSIGNED", label: "Assigned", tone: "blue", help: "A driver and time are booked for you." },
  { value: "EN_ROUTE", label: "En route", tone: "amber", help: "The driver has started the trip." },
  { value: "COMPLETED", label: "Completed", tone: "green", help: "The trip is done." },
  { value: "CANCELLED", label: "Cancelled", tone: "muted", help: "This request was cancelled." },
];

export const STATUS_LABEL = Object.fromEntries(STATUSES.map((s) => [s.value, s.label]));
export const STATUS_TONE = Object.fromEntries(STATUSES.map((s) => [s.value, s.tone]));

// duration presets for the dispatcher (minutes) used in conflict detection
export const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
  { value: 240, label: "Half day" },
  { value: 480, label: "Whole day" },
];
