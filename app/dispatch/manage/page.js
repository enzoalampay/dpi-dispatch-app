"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppBar from "../../components/AppBar";
import AdminGate from "../../components/AdminGate";
import PassengerPicker from "../../components/PassengerPicker";
import { REQUEST_TYPES } from "../../../lib/constants";

const DOW = [
  { v: 1, l: "Mon" }, { v: 2, l: "Tue" }, { v: 3, l: "Wed" }, { v: 4, l: "Thu" },
  { v: 5, l: "Fri" }, { v: 6, l: "Sat" }, { v: 0, l: "Sun" },
];

export default function ManagePage() {
  return <AdminGate>{(passcode) => <Manage passcode={passcode} />}</AdminGate>;
}

function Manage({ passcode }) {
  const [tab, setTab] = useState("people");
  const [toast, setToast] = useState("");
  function flash(m) { setToast(m); setTimeout(() => setToast(""), 2000); }
  function adminFetch(url, opts = {}) {
    return fetch(url, { ...opts, headers: { "Content-Type": "application/json", "x-admin-passcode": passcode, ...(opts.headers || {}) } });
  }

  return (
    <>
      <AppBar title="Manage" wide right={<Link className="btn btn-sm" href="/dispatch">← Board</Link>} />
      <div className="wrap-wide">
        <div className="tabs" style={{ maxWidth: 420 }}>
          <button className={tab === "people" ? "active" : ""} onClick={() => setTab("people")}>People</button>
          <button className={tab === "vehicles" ? "active" : ""} onClick={() => setTab("vehicles")}>Vehicles</button>
          <button className={tab === "templates" ? "active" : ""} onClick={() => setTab("templates")}>Standing trips</button>
        </div>
        {tab === "people" && <People adminFetch={adminFetch} flash={flash} />}
        {tab === "vehicles" && <Vehicles adminFetch={adminFetch} flash={flash} />}
        {tab === "templates" && <Templates adminFetch={adminFetch} flash={flash} />}
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

function People({ adminFetch, flash }) {
  const [people, setPeople] = useState([]);
  const [name, setName] = useState("");
  const [isDriver, setDriver] = useState(false);
  const [isAdmin, setAdmin] = useState(false);
  const [err, setErr] = useState("");

  function load() { fetch("/api/people?all=1").then((r) => r.json()).then((d) => setPeople(d.people || [])); }
  useEffect(() => { load(); }, []);

  async function add() {
    setErr("");
    if (!name.trim()) return;
    const r = await adminFetch("/api/people", { method: "POST", body: JSON.stringify({ name, isDriver, isAdmin }) });
    const d = await r.json();
    if (!r.ok) return setErr(d.error || "Failed");
    setName(""); setDriver(false); setAdmin(false); flash("Added"); load();
  }
  async function patch(id, data) {
    await adminFetch("/api/people", { method: "PATCH", body: JSON.stringify({ id, ...data }) });
    load();
  }
  function copyLink(token) {
    navigator.clipboard.writeText(`${window.location.origin}/driver/${token}`).then(() => flash("Link copied"));
  }

  return (
    <>
      <div className="card">
        <h3>Add person</h3>
        {err && <div className="error">{err}</div>}
        <div className="field"><input type="text" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="btn-row" style={{ alignItems: "center" }}>
          <label className="small checkrow"><input type="checkbox" checked={isDriver} onChange={(e) => setDriver(e.target.checked)} /> Driver</label>
          <label className="small checkrow"><input type="checkbox" checked={isAdmin} onChange={(e) => setAdmin(e.target.checked)} /> Admin</label>
          <span style={{ flex: 1 }} />
          <button className="btn btn-primary btn-sm" onClick={add}>Add</button>
        </div>
      </div>

      <div className="section-label">People ({people.length})</div>
      {people.map((p) => (
        <div className="card tight" key={p.id} style={{ opacity: p.active ? 1 : 0.55 }}>
          <div className="spread">
            <div>
              <strong>{p.name}</strong>{" "}
              {p.isDriver && <span className="badge badge-blue">Driver</span>}{" "}
              {p.isAdmin && <span className="badge badge-grey">Admin</span>}
              {p.isDriver && p.driverToken && (
                <div className="small muted" style={{ marginTop: 4 }}>
                  /driver/{p.driverToken} <button className="linkbtn" onClick={() => copyLink(p.driverToken)}>Copy link</button>
                </div>
              )}
            </div>
          </div>
          <div className="btn-row" style={{ marginTop: 8 }}>
            <button className="btn btn-sm" onClick={() => patch(p.id, { isDriver: !p.isDriver })}>{p.isDriver ? "Unset driver" : "Make driver"}</button>
            <button className="btn btn-sm" onClick={() => patch(p.id, { isAdmin: !p.isAdmin })}>{p.isAdmin ? "Unset admin" : "Make admin"}</button>
            <button className="btn btn-sm btn-ghost" onClick={() => patch(p.id, { active: !p.active })}>{p.active ? "Deactivate" : "Reactivate"}</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Vehicles({ adminFetch, flash }) {
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({ label: "", type: "", capacity: "" });
  function load() { fetch("/api/vehicles?all=1").then((r) => r.json()).then((d) => setVehicles(d.vehicles || [])); }
  useEffect(() => { load(); }, []);
  async function add() {
    if (!form.label.trim()) return;
    await adminFetch("/api/vehicles", { method: "POST", body: JSON.stringify(form) });
    setForm({ label: "", type: "", capacity: "" }); flash("Added"); load();
  }
  async function patch(id, data) { await adminFetch("/api/vehicles", { method: "PATCH", body: JSON.stringify({ id, ...data }) }); load(); }

  return (
    <>
      <div className="card">
        <h3>Add vehicle</h3>
        <div className="field"><input type="text" placeholder="Label e.g. Hilux (Grey)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
        <div className="row">
          <div className="field"><input type="text" placeholder="Type e.g. Pickup" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} /></div>
          <div className="field"><input type="text" inputMode="numeric" placeholder="Seats" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} /></div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={add}>Add</button>
      </div>
      <div className="section-label">Vehicles ({vehicles.length})</div>
      {vehicles.map((v) => (
        <div className="card tight" key={v.id} style={{ opacity: v.active ? 1 : 0.55 }}>
          <div className="spread">
            <div><strong>{v.label}</strong> <span className="muted small">{v.type}{v.capacity ? ` · ${v.capacity} seats` : ""}</span></div>
            <button className="btn btn-sm btn-ghost" onClick={() => patch(v.id, { active: !v.active })}>{v.active ? "Deactivate" : "Reactivate"}</button>
          </div>
        </div>
      ))}
    </>
  );
}

function Templates({ adminFetch, flash }) {
  const [templates, setTemplates] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState({
    label: "", defaultTime: "08:30", daysOfWeek: [1, 2, 3, 4, 5],
    pickupLocation: "", destination: "", type: "OTHER", passengers: [],
    defaultDriverId: "", defaultVehicleId: "",
  });

  function load() { fetch("/api/recurring").then((r) => r.json()).then((d) => setTemplates(d.templates || [])); }
  useEffect(() => {
    load();
    fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || []));
    fetch("/api/people").then((r) => r.json()).then((d) => setPeople(d.people || []));
    fetch("/api/vehicles").then((r) => r.json()).then((d) => setVehicles(d.vehicles || []));
  }, []);

  function toggleDay(v) {
    setForm((f) => ({ ...f, daysOfWeek: f.daysOfWeek.includes(v) ? f.daysOfWeek.filter((x) => x !== v) : [...f.daysOfWeek, v] }));
  }
  async function add() {
    if (!form.label.trim() || !form.pickupLocation.trim() || !form.destination.trim()) return;
    await adminFetch("/api/recurring", { method: "POST", body: JSON.stringify(form) });
    setForm({ ...form, label: "", pickupLocation: "", destination: "", passengers: [] });
    flash("Added"); load();
  }
  async function patch(id, data) { await adminFetch("/api/recurring", { method: "PATCH", body: JSON.stringify({ id, ...data }) }); load(); }

  return (
    <>
      <div className="card">
        <h3>Add standing trip</h3>
        <div className="field"><label>Label</label><input type="text" placeholder="e.g. Marikina AM shuttle" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
        <div className="row">
          <div className="field"><label>Time</label><input type="time" value={form.defaultTime} onChange={(e) => setForm({ ...form, defaultTime: e.target.value })} /></div>
          <div className="field"><label>Type</label>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {REQUEST_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Days</label>
          <div className="chips">
            {DOW.map((d) => (
              <span key={d.v} className={`chip ${form.daysOfWeek.includes(d.v) ? "on" : ""}`} onClick={() => toggleDay(d.v)}>{d.l}</span>
            ))}
          </div>
        </div>
        <div className="field"><label>Pickup</label><input type="text" value={form.pickupLocation} onChange={(e) => setForm({ ...form, pickupLocation: e.target.value })} /></div>
        <div className="field"><label>Destination</label><input type="text" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} /></div>
        <div className="field"><label>Passengers</label><PassengerPicker people={people} value={form.passengers} onChange={(v) => setForm({ ...form, passengers: v })} /></div>
        <div className="row">
          <div className="field"><label>Default driver</label>
            <select value={form.defaultDriverId} onChange={(e) => setForm({ ...form, defaultDriverId: e.target.value })}>
              <option value="">— none —</option>
              {drivers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="field"><label>Default vehicle</label>
            <select value={form.defaultVehicleId} onChange={(e) => setForm({ ...form, defaultVehicleId: e.target.value })}>
              <option value="">— none —</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={add}>Add standing trip</button>
      </div>

      <div className="section-label">Standing trips ({templates.length})</div>
      {templates.map((t) => (
        <div className="card tight" key={t.id} style={{ opacity: t.active ? 1 : 0.55 }}>
          <div className="spread">
            <div>
              <strong>{t.defaultTime} · {t.label}</strong>
              <div className="small muted">{t.pickupLocation} → {t.destination}</div>
              <div className="small muted">
                {DOW.filter((d) => t.daysOfWeek.includes(d.v)).map((d) => d.l).join(", ") || "no days"}
                {t.defaultDriverName ? ` · ${t.defaultDriverName}` : ""}
              </div>
            </div>
            <button className="btn btn-sm btn-ghost" onClick={() => patch(t.id, { active: !t.active })}>{t.active ? "Disable" : "Enable"}</button>
          </div>
        </div>
      ))}
    </>
  );
}
