"use client";
import { useEffect, useMemo, useState } from "react";
import AppBar from "../components/AppBar";
import { STATUSES, STATUS_TONE, STATUS_LABEL, TYPE_LABEL } from "../../lib/constants";
import { todayYMD, addDaysYMD, prettyDate } from "../../lib/dates";

export default function HistoryPage() {
  const [from, setFrom] = useState(addDaysYMD(todayYMD(), -30));
  const [to, setTo] = useState(todayYMD());
  const [driverId, setDriverId] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || [])).catch(() => {});
  }, []);

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (driverId) p.set("driverId", driverId);
    if (status) p.set("status", status);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [from, to, driverId, status, q]);

  function load() {
    setLoading(true);
    fetch(`/api/requests?${queryString}&limit=2000`)
      .then((r) => r.json())
      .then((d) => setRows(d.requests || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [queryString]);

  return (
    <>
      <AppBar title="History" wide />
      <div className="wrap-wide">
        <div className="pagetitle">
          <h1>Dispatch history</h1>
          <div className="sub">Search past dispatches and export to a spreadsheet.</div>
        </div>

        <div className="card">
          <div className="row" style={{ flexWrap: "wrap" }}>
            <div className="field" style={{ minWidth: 140 }}>
              <label>From</label>
              <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="field" style={{ minWidth: 140 }}>
              <label>To</label>
              <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="field" style={{ minWidth: 140 }}>
              <label>Driver</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">All drivers</option>
                {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="field" style={{ minWidth: 140 }}>
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">Any status</option>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Search pickup / destination / requester / purpose</label>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. Imus, NAIA, Cheng…" />
          </div>
          <div className="btn-row" style={{ marginTop: 14 }}>
            <a className="btn btn-primary" href={`/api/export?${queryString}`}>⬇ Export CSV</a>
            <span className="small muted" style={{ alignSelf: "center" }}>
              {loading ? "Loading…" : `${rows.length} record${rows.length === 1 ? "" : "s"}`}
            </span>
          </div>
        </div>

        {rows.length === 0 && !loading ? (
          <div className="empty">No dispatches match these filters.</div>
        ) : (
          <>
            {/* wide screens: full table */}
            <div className="table-wrap">
              <table className="grid">
                <thead>
                  <tr>
                    <th>Date</th><th>Time</th><th>Status</th><th>Type</th>
                    <th>Requester</th><th>Pickup</th><th>Destination</th>
                    <th>Passengers</th><th>Driver</th><th>Vehicle</th><th>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>{prettyDate(r.serviceDate)}</td>
                      <td>{r.scheduledTime || r.timeNeeded}</td>
                      <td><span className={`badge badge-${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span></td>
                      <td>{TYPE_LABEL[r.type] || r.type}</td>
                      <td>{r.requesterName}</td>
                      <td>{r.pickupLocation}</td>
                      <td>{r.destination}</td>
                      <td>{(r.passengers || []).join(", ")}</td>
                      <td>{r.driverName || "—"}</td>
                      <td>{r.vehicleLabel || "—"}</td>
                      <td>{r.purpose || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ≤640px: stacked record cards (the 11-col table is unreadable on phones) */}
            <div className="hist-cards">
              {rows.map((r) => (
                <div className="hist-card" key={r.id}>
                  <div className="top">
                    <span className="when">{prettyDate(r.serviceDate)} · {r.scheduledTime || r.timeNeeded}</span>
                    <span className={`badge badge-${STATUS_TONE[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    <span className="tag">{TYPE_LABEL[r.type] || r.type}</span>
                  </div>
                  <div className="route">{r.pickupLocation} → {r.destination}</div>
                  <div className="kv"><b>By</b> {r.requesterName}{(r.passengers || []).length ? ` · 👤 ${r.passengers.join(", ")}` : ""}</div>
                  <div className="kv"><b>Driver</b> {r.driverName || "—"}{r.vehicleLabel ? ` · ${r.vehicleLabel}` : ""}</div>
                  {r.purpose ? <div className="kv"><b>Purpose</b> {r.purpose}</div> : null}
                </div>
              ))}
            </div>
          </>
        )}

      </div>
    </>
  );
}
