"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import AppBar from "../../components/AppBar";
import { STATUS_TONE, STATUS_LABEL, TYPE_LABEL } from "../../../lib/constants";
import { todayYMD, prettyDate, addDaysYMD } from "../../../lib/dates";
import { fmtRange } from "../../../lib/time";

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

  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, date]);

  // remember this driver on this device (powers More → My driver schedule)
  useEffect(() => {
    if (driver && token) localStorage.setItem("dispatch_driver_token", token);
  }, [driver, token]);

  async function setStatus(id, status) {
    await fetch("/api/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    load();
  }

  return (
    <>
      <AppBar title="My trips" href="#" right={driver ? <span className="who">{driver.name}</span> : null} />
      <div className="wrap">
        {error && <div className="pagetitle"><div className="error">{error}</div></div>}

        <div className="daynav">
          <button className="btn btn-sm" onClick={() => setDate(addDaysYMD(date, -1))}>‹ Prev</button>
          <div className="label">{prettyDate(date)}{date === todayYMD() ? " · Today" : ""}</div>
          <button className="btn btn-sm" onClick={() => setDate(addDaysYMD(date, 1))}>Next ›</button>
        </div>

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
                <button className="btn btn-sm btn-primary" onClick={() => setStatus(t.id, "EN_ROUTE")}>Start trip</button>
              )}
              {t.status === "EN_ROUTE" && (
                <button className="btn btn-sm btn-primary" onClick={() => setStatus(t.id, "COMPLETED")}>Mark done</button>
              )}
              {t.status === "COMPLETED" && (
                <button className="btn btn-sm btn-ghost" onClick={() => setStatus(t.id, "EN_ROUTE")}>Undo</button>
              )}
            </div>
          </div>
        ))}

        <div className="small muted" style={{ marginTop: 18, textAlign: "center" }}>
          This is your personal schedule. Find it anytime: <b>More → My driver schedule</b>.
        </div>
      </div>
    </>
  );
}
