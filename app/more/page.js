"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import AppBar from "../components/AppBar";

function Card({ href, icon, title, desc }) {
  return (
    <Link className="home-link" href={href}>
      <span className="ic">{icon}</span>
      <span>
        <span className="t" style={{ display: "block" }}>{title}</span>
        <span className="d">{desc}</span>
      </span>
      <span className="chev">›</span>
    </Link>
  );
}

export default function MorePage() {
  const [driverToken, setDriverToken] = useState("");
  const [drivers, setDrivers] = useState([]);
  const [pickDriver, setPickDriver] = useState(false);

  useEffect(() => {
    setDriverToken(localStorage.getItem("dispatch_driver_token") || "");
  }, []);

  function openDriverPicker() {
    setPickDriver(true);
    if (drivers.length === 0) {
      fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || [])).catch(() => {});
    }
  }

  return (
    <>
      <AppBar />
      <div className="wrap">
        <div className="pagetitle">
          <h1>More</h1>
          <div className="sub">Everything else in one place.</div>
        </div>

        <div className="section-label">For everyone</div>
        <div className="home-links">
          <Card href="/guide" icon="📖" title="How it works" desc="2-minute guide for the whole team" />
          <Card href="/history" icon="🕘" title="History" desc="Past dispatches, search and export" />
        </div>

        <div className="section-label">For drivers</div>
        <div className="home-links">
          {driverToken && !pickDriver ? (
            <Card href={`/driver/${driverToken}`} icon="🚗" title="My driver schedule" desc="Your trips for the day" />
          ) : null}
          {!driverToken && !pickDriver ? (
            <button className="home-link" style={{ textAlign: "left", cursor: "pointer", font: "inherit" }} onClick={openDriverPicker}>
              <span className="ic">🚗</span>
              <span>
                <span className="t" style={{ display: "block" }}>My driver schedule</span>
                <span className="d">Drivers: tap once to find your page</span>
              </span>
              <span className="chev">›</span>
            </button>
          ) : null}
          {pickDriver && (
            <div className="card">
              <div className="small" style={{ marginBottom: 10, fontWeight: 600 }}>Which driver are you?</div>
              <div className="chips">
                {drivers.length === 0 && <span className="small muted">Loading…</span>}
                {drivers.map((d) => (
                  <Link key={d.id} className="chip" href={`/driver/${d.driverToken}`}>{d.name}</Link>
                ))}
              </div>
              <div className="small muted" style={{ marginTop: 10 }}>
                Your phone will remember your page after you open it once.
              </div>
            </div>
          )}
          {driverToken && (
            <button className="linkbtn small" style={{ textAlign: "left", padding: "0 4px" }} onClick={openDriverPicker}>
              Not you? Pick a different driver
            </button>
          )}
        </div>

        <div className="section-label">For the dispatcher</div>
        <div className="home-links">
          <Card href="/dispatch" icon="🗂️" title="Dispatcher board" desc="Assign drivers and vehicles (passcode)" />
          <Card href="/dispatch/manage" icon="⚙️" title="Manage" desc="People, vehicles, standing trips (passcode)" />
        </div>
      </div>
    </>
  );
}
