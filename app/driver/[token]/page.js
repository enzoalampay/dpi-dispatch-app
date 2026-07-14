"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppBar from "../../components/AppBar";
import PushToggle from "../../components/PushToggle";
import { STATUS_TONE, STATUS_LABEL, TYPE_LABEL } from "../../../lib/constants";
import { todayYMD, prettyDate, addDaysYMD } from "../../../lib/dates";
import { fmtRange } from "../../../lib/time";
import { usePolling } from "../../../lib/usePolling";

function mapLink(place) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place)}`;
}

export default function DriverPage() {
  const { token } = useParams();
  const [date, setDate] = useState(todayYMD());
  const [driver, setDriver] = useState(null);
  const [trips, setTrips] = useState([]);
  const [error, setError] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [pending, setPending] = useState({}); // trip ids with an in-flight status change
  const [toast, setToast] = useState("");

  function load() {
    fetch(`/api/driver/${token}?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error); return; }
        setDriver(d.driver);
        setTrips(d.trips || []);
        setError("");
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }

  usePolling(load, 20000, [token, date]);

  // remember this driver on this device (powers More → My driver schedule)
  useEffect(() => {
    if (driver && token) localStorage.setItem("dispatch_driver_token", token);
  }, [driver, token]);

  // Optimistic: flip the badge + button locally now, roll back + toast on failure.
  async function setStatus(id, status) {
    const prev = trips;
    setTrips((ts) => ts.map((t) => (t.id === id ? { ...t, status } : t)));
    setPending((p) => ({ ...p, [id]: true }));
    try {
      const r = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (!r.ok) throw new Error();
      load();
    } catch {
      setTrips(prev);
      setToast("Couldn't update — try again");
      setTimeout(() => setToast(""), 2400);
    } finally {
      setPending((p) => { const n = { ...p }; delete n[id]; return n; });
    }
  }

  return (
    <>
      <AppBar title="My trips" right={driver ? <span className="who">{driver.name}</span> : null} />
      <div className="wrap">
        {error && <div className="pagetitle"><div className="error">{error}</div></div>}

        <div className="daynav">
          <button className="btn btn-sm btn-icon" onClick={() => setDate(addDaysYMD(date, -1))}>‹ Prev</button>
          <div className="label">{prettyDate(date)}{date === todayYMD() ? " · Today" : ""}</div>
          <button className="btn btn-sm btn-icon" onClick={() => setDate(addDaysYMD(date, 1))}>Next ›</button>
          <button className="btn btn-sm" onClick={() => setDate(todayYMD())}>Today</button>
        </div>

        <PushToggle role="driver" personName={driver?.name} label="Notify me of new trips" />

        {loaded && trips.length === 0 && !error && (
          <div className="empty">No trips for this day.</div>
        )}

        {trips.map((t, i) => (
          <div className="trip" key={t.id}>
            <div className="head">
              <div className="time">{fmtRange(t.scheduledTime || t.timeNeeded, t.estDurationMin || 60)}</div>
              <div className="grow">
                <div className="route">
                  {t.pickupLocation} <span className="arrow">→</span> {t.destination}
                </div>
                <div className="meta">
                  <span className="tag">{TYPE_LABEL[t.type] || t.type}</span>
                  {t.vehicleLabel ? <span> · {t.vehicleLabel}</span> : null}
                </div>
                {t.passengers?.length > 0 && <div className="pax">👤 {t.passengers.join(", ")}</div>}
                {t.purpose ? <div className="meta">{t.purpose}</div> : null}
                {t.equipment ? <div className="meta">📦 {t.equipment}</div> : null}
              </div>
              <span className={`badge badge-${STATUS_TONE[t.status] || "grey"}`}>{STATUS_LABEL[t.status]}</span>
            </div>
            <div className="foot">
              <a className="btn btn-sm" href={mapLink(t.pickupLocation)} target="_blank" rel="noreferrer">📍 Pickup</a>
              <a className="btn btn-sm" href={mapLink(t.destination)} target="_blank" rel="noreferrer">📍 Drop-off</a>
              <span className="spacer" style={{ flex: 1 }} />
              {t.status === "ASSIGNED" && (
                <button className="btn btn-sm btn-primary" onClick={() => setStatus(t.id, "EN_ROUTE")} disabled={pending[t.id]}>Start trip</button>
              )}
              {t.status === "EN_ROUTE" && (
                <button className="btn btn-sm btn-primary" onClick={() => setStatus(t.id, "COMPLETED")} disabled={pending[t.id]}>Mark done</button>
              )}
              {t.status === "COMPLETED" && (
                <button className="btn btn-sm btn-ghost" onClick={() => setStatus(t.id, "EN_ROUTE")} disabled={pending[t.id]}>Undo</button>
              )}
            </div>
          </div>
        ))}

        <div className="small muted" style={{ marginTop: 18, textAlign: "center" }}>
          This is your personal schedule. Find it anytime: <b>More → My driver schedule</b>.
        </div>
      </div>
      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
