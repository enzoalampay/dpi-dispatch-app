"use client";
import { toMinutes } from "../../lib/conflicts";
import { fmtRange } from "../../lib/time";
import { todayYMD } from "../../lib/dates";

const HOUR_H = 56;
const MIN_EVENT_H = 40; // usable touch target for short trips

const TONE = {
  REQUESTED: "var(--grey-bg)",
  ASSIGNED: "var(--blue-bg)",
  EN_ROUTE: "var(--amber-bg)",
  COMPLETED: "var(--green-bg)",
};
const startMin = (t) => toMinutes(t.scheduledTime || t.timeNeeded);
const durOf = (t) => t.estDurationMin || 60;

// Assign each event to a sub-lane so overlapping events sit side by side.
function packColumn(trips) {
  const items = trips
    .map((t) => { const s = startMin(t); return s == null ? null : { t, s, e: s + durOf(t) }; })
    .filter(Boolean)
    .sort((a, b) => a.s - b.s || a.e - b.e);
  const laneEnds = [];
  for (const it of items) {
    let l = laneEnds.findIndex((end) => end <= it.s);
    if (l < 0) { l = laneEnds.length; laneEnds.push(it.e); }
    else laneEnds[l] = it.e;
    it.lane = l;
  }
  return { items, lanes: Math.max(1, laneEnds.length) };
}

export default function DayCalendar({ date, drivers, requests, onTripClick, includeUnassigned = true }) {
  const active = (requests || []).filter((r) => r.status !== "CANCELLED");

  const starts = [], ends = [];
  for (const r of active) { const s = startMin(r); if (s != null) { starts.push(s); ends.push(s + durOf(r)); } }
  const dayStart = Math.floor(Math.min(6 * 60, starts.length ? Math.min(...starts) : 6 * 60) / 60) * 60;
  const dayEnd = Math.ceil(Math.max(19 * 60, ends.length ? Math.max(...ends) : 19 * 60) / 60) * 60;
  const bodyH = ((dayEnd - dayStart) / 60) * HOUR_H;
  const yOf = (m) => ((m - dayStart) / 60) * HOUR_H;

  const hours = [];
  for (let h = dayStart / 60; h <= dayEnd / 60; h++) hours.push(h);

  const cols = [];
  if (includeUnassigned) cols.push({ id: "_un", label: "Incoming", muted: true, trips: active.filter((r) => !r.driverId) });
  for (const d of drivers) cols.push({ id: d.id, label: d.name, trips: active.filter((r) => r.driverId === d.id) });

  const showNow = date === todayYMD();
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const nowY = showNow && nowMin >= dayStart && nowMin <= dayEnd ? yOf(nowMin) : null;

  return (
    <div className="cal-wrap">
      <div className="cal">
        <div className="cal-head">
          <div className="cal-corner" />
          {cols.map((c) => (
            <div key={c.id} className={`cal-colhead${c.muted ? " muted" : ""}`}>
              {c.label} <span className="cnt">{c.trips.filter((t) => startMin(t) != null).length}</span>
            </div>
          ))}
        </div>
        <div className="cal-body" style={{ height: bodyH }}>
          <div className="cal-gutter" style={{ height: bodyH }}>
            {hours.map((h) => (
              <div key={h} className="cal-hourlabel" style={{ top: yOf(h * 60) }}>{String(h).padStart(2, "0")}:00</div>
            ))}
          </div>
          {nowY != null && <div className="cal-now" style={{ top: nowY }} />}
          {cols.map((c) => {
            const { items, lanes } = packColumn(c.trips);
            return (
              <div key={c.id} className={`cal-col${c.muted ? " muted" : ""}`} style={{ height: bodyH }}>
                {hours.map((h) => (<div key={h} className="cal-hourline" style={{ top: yOf(h * 60) }} />))}
                {items.map(({ t, s, e, lane }) => {
                  const top = yOf(s);
                  const h = Math.max(MIN_EVENT_H, ((e - s) / 60) * HOUR_H - 2);
                  const width = `calc(${100 / lanes}% - 4px)`;
                  const left = `calc(${(lane * 100) / lanes}% + 2px)`;
                  const range = fmtRange(t.scheduledTime || t.timeNeeded, durOf(t));
                  const detail = `${range} · ${t.pickupLocation} → ${t.destination}` +
                    (t.passengers?.length ? ` · ${t.passengers.join(", ")}` : "") +
                    (t.purpose ? ` · ${t.purpose}` : "");
                  return (
                    <div
                      key={t.id}
                      className={`cal-event${onTripClick ? " clickable" : ""}`}
                      title={detail}
                      style={{ top, height: h, left, width, background: TONE[t.status] || TONE.REQUESTED }}
                      onClick={onTripClick ? () => onTripClick(t) : undefined}
                    >
                      <div className="et">{range}</div>
                      <div className="ed">{t.destination}</div>
                      {h >= 46 && t.passengers?.length ? <div className="ep">{t.passengers.join(", ")}</div> : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function CalendarLegend() {
  const items = [
    { c: "var(--grey-bg)", l: "Incoming" },
    { c: "var(--blue-bg)", l: "Assigned" },
    { c: "var(--amber-bg)", l: "En route" },
    { c: "var(--green-bg)", l: "Completed" },
  ];
  return (
    <div className="legend">
      {items.map((i) => (
        <span className="k" key={i.l}><span className="sw" style={{ background: i.c }} /> {i.l}</span>
      ))}
    </div>
  );
}
