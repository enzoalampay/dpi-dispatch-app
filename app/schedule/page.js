"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppBar from "../components/AppBar";
import DayCalendar, { CalendarLegend } from "../components/DayCalendar";
import { STATUS_LABEL, STATUS_TONE, TYPE_LABEL } from "../../lib/constants";
import { todayYMD, prettyDate, addDaysYMD } from "../../lib/dates";
import { fmtRange } from "../../lib/time";
import { usePolling } from "../../lib/usePolling";

function ScheduleInner() {
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") || todayYMD());
  const [drivers, setDrivers] = useState([]);
  const [requests, setRequests] = useState(null); // null = first load in progress
  const [detail, setDetail] = useState(null); // trip shown in the read-only sheet

  useEffect(() => {
    fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || [])).catch(() => {});
  }, []);

  function load() {
    fetch(`/api/requests?date=${date}`).then((r) => r.json()).then((d) => setRequests(d.requests || [])).catch(() => {});
  }
  useEffect(() => { setRequests(null); }, [date]); // drop stale day immediately
  usePolling(load, 20000, [date]);

  const loading = requests === null;
  const assignedCount = (requests || []).filter((r) => r.driverId && r.status !== "CANCELLED").length;

  return (
    <>
      <AppBar title="Driver schedule" wide />
      <div className="wrap-wide">
        <div className="pagetitle">
          <h1>Who's driving, and when</h1>
          <div className="sub">See where drivers are committed before you make a request.</div>
        </div>

        <div className="daynav">
          <button className="btn btn-sm btn-icon" onClick={() => setDate(addDaysYMD(date, -1))}>‹</button>
          <div className="label">{prettyDate(date)}{date === todayYMD() ? " · Today" : ""}</div>
          <button className="btn btn-sm btn-icon" onClick={() => setDate(addDaysYMD(date, 1))}>›</button>
          <button className="btn btn-sm" onClick={() => setDate(todayYMD())}>Today</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 150 }} />
        </div>

        <CalendarLegend />
        {loading ? (
          <div className="empty">Loading schedule…</div>
        ) : (
          <DayCalendar date={date} drivers={drivers} requests={requests} includeUnassigned onTripClick={(t) => setDetail(t)} />
        )}

        <div className="small muted" style={{ marginTop: 12 }}>
          {assignedCount} trip{assignedCount === 1 ? "" : "s"} scheduled. Empty columns = free all
          day. Tap a block for details. This view updates automatically.
        </div>
      </div>

      {detail && <ScheduleDetail trip={detail} onClose={() => setDetail(null)} />}
    </>
  );
}

// Read-only bottom sheet — the calendar block detail lived in title= before,
// which is dead on touch. Reuses the .modal-bg/.modal shell.
function ScheduleDetail({ trip, onClose }) {
  const start = trip.scheduledTime || trip.timeNeeded;
  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{fmtRange(start, trip.estDurationMin || 60)}</h2>
          <span className={`badge badge-${STATUS_TONE[trip.status] || "grey"}`}>{STATUS_LABEL[trip.status] || trip.status}</span>
        </div>
        <div className="route" style={{ fontWeight: 600, marginBottom: 12 }}>
          {trip.pickupLocation} <span className="arrow">→</span> {trip.destination}
        </div>
        <div className="detail-list">
          <div className="di"><span className="dk">What for</span><span className="dv">{TYPE_LABEL[trip.type] || trip.type}</span></div>
          <div className="di"><span className="dk">Requested by</span><span className="dv">{trip.requesterName || "—"}</span></div>
          {trip.passengers?.length > 0 && (
            <div className="di"><span className="dk">Passengers</span><span className="dv">{trip.passengers.join(", ")}</span></div>
          )}
          <div className="di"><span className="dk">Driver</span><span className="dv">{trip.driverName || "Not assigned yet"}{trip.vehicleLabel ? ` · ${trip.vehicleLabel}` : ""}</span></div>
          {trip.purpose ? <div className="di"><span className="dk">Notes</span><span className="dv">{trip.purpose}</span></div> : null}
          {trip.equipment ? <div className="di"><span className="dk">Equipment</span><span className="dv">{trip.equipment}</span></div> : null}
        </div>
        <div className="btn-row" style={{ marginTop: 16 }}>
          <button className="btn btn-block" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="wrap"><div className="empty">Loading…</div></div>}>
      <ScheduleInner />
    </Suspense>
  );
}
