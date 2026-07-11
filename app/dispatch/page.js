"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppBar from "../components/AppBar";
import AdminGate from "../components/AdminGate";
import TripRow from "../components/TripRow";
import DayCalendar, { CalendarLegend } from "../components/DayCalendar";
import { REQUEST_TYPES, DURATION_OPTIONS, TYPE_LABEL } from "../../lib/constants";
import { todayYMD, prettyDate, addDaysYMD } from "../../lib/dates";
import { buildDriverMessage, viberDeepLink } from "../../lib/viber";

const timeKey = (t) => t.scheduledTime || t.timeNeeded || "99:99";

export default function DispatchPage() {
  return <AdminGate>{(passcode) => <Board passcode={passcode} />}</AdminGate>;
}

function Board({ passcode }) {
  const [date, setDate] = useState(todayYMD());
  const [requests, setRequests] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [assignFor, setAssignFor] = useState(null);
  const [view, setViewState] = useState("list");
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  // remember the dispatcher's preferred view on this device
  useEffect(() => {
    const saved = localStorage.getItem("dispatch_board_view");
    if (saved === "timeline" || saved === "list") setViewState(saved);
  }, []);
  function setView(v) {
    setViewState(v);
    localStorage.setItem("dispatch_board_view", v);
  }

  function adminFetch(url, opts = {}) {
    return fetch(url, {
      ...opts,
      headers: { "Content-Type": "application/json", "x-admin-passcode": passcode, ...(opts.headers || {}) },
    });
  }
  function flash(m) { setToast(m); setTimeout(() => setToast(""), 2400); }

  function loadRequests() {
    fetch(`/api/requests?date=${date}`).then((r) => r.json()).then((d) => setRequests(d.requests || [])).catch(() => {});
  }
  useEffect(() => {
    fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || [])).catch(() => {});
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles || [])).catch(() => {});
  }, []);
  useEffect(() => {
    loadRequests();
    const id = setInterval(loadRequests, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const driverByToken = useMemo(() => Object.fromEntries(drivers.map((d) => [d.id, d])), [drivers]);

  const active = requests.filter((r) => r.status !== "CANCELLED");
  const unassigned = active.filter((r) => !r.driverId).sort((a, b) => timeKey(a).localeCompare(timeKey(b)));
  const assigned = active.filter((r) => r.driverId);

  const groups = useMemo(() => {
    const m = new Map();
    for (const r of assigned) {
      if (!m.has(r.driverId)) m.set(r.driverId, []);
      m.get(r.driverId).push(r);
    }
    const arr = [...m.entries()].map(([driverId, trips]) => ({
      driverId,
      driver: driverByToken[driverId],
      name: trips[0].driverName || "Driver",
      trips: trips.sort((a, b) => timeKey(a).localeCompare(timeKey(b))),
    }));
    arr.sort((a, b) => timeKey(a.trips[0]).localeCompare(timeKey(b.trips[0])));
    return arr;
  }, [assigned, driverByToken]);

  async function generate() {
    const r = await adminFetch("/api/recurring/generate", { method: "POST", body: JSON.stringify({ date }) });
    const d = await r.json();
    if (!r.ok) return setError(d.error || "Generate failed");
    flash(`Standing trips: ${d.createdCount} added, ${d.skipped} already there`);
    loadRequests();
  }

  async function setStatus(id, status) {
    await adminFetch("/api/requests", { method: "PATCH", body: JSON.stringify({ id, status }) });
    loadRequests();
  }
  async function unassign(id) {
    await adminFetch("/api/requests", { method: "PATCH", body: JSON.stringify({ id, unassign: true }) });
    loadRequests();
  }

  function shareViber(group) {
    const origin = window.location.origin;
    const token = group.driver?.driverToken;
    const url = token ? `${origin}/driver/${token}` : "";
    const msg = buildDriverMessage({ driverName: group.name, dateLabel: prettyDate(date), trips: group.trips, driverUrl: url });
    window.location.href = viberDeepLink(msg);
  }
  async function copyViber(group) {
    const origin = window.location.origin;
    const token = group.driver?.driverToken;
    const url = token ? `${origin}/driver/${token}` : "";
    const msg = buildDriverMessage({ driverName: group.name, dateLabel: prettyDate(date), trips: group.trips, driverUrl: url });
    try { await navigator.clipboard.writeText(msg); flash("Message copied"); } catch { flash("Copy failed"); }
  }

  const rightNav = <Link className="btn btn-sm" href="/dispatch/manage">Manage</Link>;

  return (
    <>
      <AppBar title="Dispatcher" wide right={rightNav} />
      <div className="wrap-wide">
        {error && <div className="pagetitle"><div className="error">{error}</div></div>}

        <div className="daynav">
          <button className="btn btn-sm" onClick={() => setDate(addDaysYMD(date, -1))}>‹</button>
          <div className="label">{prettyDate(date)}{date === todayYMD() ? " · Today" : ""}</div>
          <button className="btn btn-sm" onClick={() => setDate(addDaysYMD(date, 1))}>›</button>
          <button className="btn btn-sm" onClick={() => setDate(todayYMD())}>Today</button>
          <button className="btn btn-sm btn-primary" onClick={generate}>+ Standing trips</button>
          <span style={{ flex: 1 }} />
          <div className="tabs" style={{ margin: 0, maxWidth: 200 }}>
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}>List</button>
            <button className={view === "timeline" ? "active" : ""} onClick={() => setView("timeline")}>Timeline</button>
          </div>
        </div>

        {view === "timeline" && (
          <div style={{ marginBottom: 18 }}>
            <CalendarLegend />
            <DayCalendar date={date} drivers={drivers} requests={requests} includeUnassigned onTripClick={(t) => setAssignFor(t)} />
            <div className="small muted" style={{ marginTop: 8 }}>Tap any block to assign or edit. Red line = now.</div>
          </div>
        )}

        {view === "list" && (
        <div className="board">
          {/* Unassigned queue */}
          <div>
            <div className="col-head">
              <h2>Incoming</h2>
              <span className="count">{unassigned.length}</span>
            </div>
            {unassigned.length === 0 && <div className="empty">Nothing waiting.</div>}
            {unassigned.map((t) => (
              <TripRow key={t.id} trip={t} showRequester>
                <button className="btn btn-sm btn-primary" onClick={() => setAssignFor(t)}>Assign</button>
              </TripRow>
            ))}
          </div>

          {/* Assigned by driver */}
          <div>
            <div className="col-head">
              <h2>Scheduled</h2>
              <span className="count">{assigned.length}</span>
            </div>
            {groups.length === 0 && <div className="empty">No trips assigned yet.</div>}
            {groups.map((g) => (
              <div className="driver-group" key={g.driverId}>
                <div className="gh">
                  <span className="badge badge-blue">🚗 {g.name}</span>
                  <span className="count">{g.trips.length}</span>
                  <span style={{ flex: 1 }} />
                  <button className="btn btn-sm" onClick={() => copyViber(g)}>Copy</button>
                  <button className="btn btn-sm btn-accent" onClick={() => shareViber(g)}>Viber</button>
                </div>
                {g.trips.map((t) => (
                  <TripRow key={t.id} trip={t} showRequester showDriver={false}>
                    {t.vehicleLabel ? <span className="tag">{t.vehicleLabel}</span> : <span className="tag" style={{ color: "var(--accent)" }}>no vehicle</span>}
                    <span style={{ flex: 1 }} />
                    <button className="btn btn-sm" onClick={() => setAssignFor(t)}>Edit</button>
                    <button className="btn btn-sm btn-ghost" onClick={() => unassign(t.id)}>Unassign</button>
                    {t.status === "ASSIGNED" && <button className="btn btn-sm" onClick={() => setStatus(t.id, "EN_ROUTE")}>Start</button>}
                    {t.status === "EN_ROUTE" && <button className="btn btn-sm" onClick={() => setStatus(t.id, "COMPLETED")}>Done</button>}
                  </TripRow>
                ))}
              </div>
            ))}
          </div>
        </div>
        )}
      </div>

      {assignFor && (
        <AssignModal
          request={assignFor}
          drivers={drivers}
          vehicles={vehicles}
          adminFetch={adminFetch}
          onClose={() => setAssignFor(null)}
          onDone={() => { setAssignFor(null); loadRequests(); flash("Assigned ✓"); }}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function AssignModal({ request, drivers, vehicles, adminFetch, onClose, onDone }) {
  const [driverId, setDriverId] = useState(request.driverId || "");
  const [vehicleId, setVehicleId] = useState(request.vehicleId || "");
  const [scheduledTime, setScheduledTime] = useState(request.scheduledTime || request.timeNeeded || "08:00");
  const [estDurationMin, setEst] = useState(request.estDurationMin || 60);
  const [conflicts, setConflicts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(force) {
    if (!driverId) return setErr("Pick a driver.");
    setBusy(true); setErr("");
    try {
      const r = await adminFetch("/api/assign", {
        method: "POST",
        body: JSON.stringify({ id: request.id, driverId, vehicleId: vehicleId || null, scheduledTime, estDurationMin, force }),
      });
      const d = await r.json();
      if (r.status === 409 && d.conflict) { setConflicts(d); setBusy(false); return; }
      if (!r.ok) throw new Error(d.error || "Assign failed");
      onDone(d.request);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  const allConflicts = conflicts ? [...(conflicts.driverConflicts || []), ...(conflicts.vehicleConflicts || [])] : [];

  return (
    <div className="modal-bg" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Assign trip</h2>
        <div className="card tight" style={{ background: "var(--bg)", boxShadow: "none" }}>
          <div className="route" style={{ fontWeight: 600 }}>{request.pickupLocation} → {request.destination}</div>
          <div className="meta small muted">
            {prettyDate(request.serviceDate)} · {request.endTime ? `${request.timeNeeded}–${request.endTime}` : request.timeNeeded} · <span className="tag">{TYPE_LABEL[request.type]}</span> · by {request.requesterName}
          </div>
          {request.passengers?.length > 0 && <div className="pax small">👤 {request.passengers.join(", ")}</div>}
        </div>

        {err && <div className="error" style={{ marginTop: 12 }}>{err}</div>}

        {conflicts && (
          <div className="warn" style={{ marginTop: 12 }}>
            <strong>Double-booking:</strong> this driver/vehicle already has:
            <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
              {allConflicts.map((c) => (
                <li key={c.id}>{c.scheduledTime || c.timeNeeded} — {c.pickupLocation} → {c.destination}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="field" style={{ marginTop: 12 }}>
          <label>Driver</label>
          <select value={driverId} onChange={(e) => { setDriverId(e.target.value); setConflicts(null); }}>
            <option value="">— choose driver —</option>
            {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div className="row">
          <div className="field">
            <label>Vehicle</label>
            <select value={vehicleId} onChange={(e) => { setVehicleId(e.target.value); setConflicts(null); }}>
              <option value="">— none —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label>Time</label>
            <input type="time" value={scheduledTime} onChange={(e) => { setScheduledTime(e.target.value); setConflicts(null); }} />
          </div>
        </div>
        <div className="field">
          <label>Estimated duration <span className="muted small">(for conflict checks)</span></label>
          <select value={estDurationMin} onChange={(e) => { setEst(parseInt(e.target.value, 10)); setConflicts(null); }}>
            {DURATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="btn-row" style={{ marginTop: 8 }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <span style={{ flex: 1 }} />
          {conflicts ? (
            <button className="btn btn-accent" onClick={() => submit(true)} disabled={busy}>Assign anyway</button>
          ) : (
            <button className="btn btn-primary" onClick={() => submit(false)} disabled={busy}>{busy ? "Saving…" : "Assign"}</button>
          )}
        </div>
      </div>
    </div>
  );
}
