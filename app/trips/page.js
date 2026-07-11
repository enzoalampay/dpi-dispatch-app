"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import AppBar from "../components/AppBar";
import TripRow from "../components/TripRow";
import { STATUSES } from "../../lib/constants";

function TripsInner() {
  const params = useSearchParams();
  const router = useRouter();
  const justSubmitted = params.get("submitted") === "1";
  const [person, setPerson] = useState("");
  const [trips, setTrips] = useState(null); // null = loading
  const [showLegend, setShowLegend] = useState(false);

  useEffect(() => {
    setPerson(localStorage.getItem("dispatch_person") || "");
  }, []);

  function load(name) {
    fetch(`/api/requests?requester=${encodeURIComponent(name)}&limit=50`)
      .then((r) => r.json())
      .then((d) => setTrips(d.requests || []))
      .catch(() => setTrips([]));
  }

  useEffect(() => {
    if (!person) return;
    load(person);
    const id = setInterval(() => load(person), 15000);
    return () => clearInterval(id);
  }, [person]);

  async function cancelReq(id) {
    if (!confirm("Cancel this request?")) return;
    await fetch("/api/requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "CANCELLED" }),
    });
    load(person);
  }

  return (
    <>
      <AppBar right={person ? <span className="who">{person}</span> : null} />
      <div className="wrap">
        <div className="pagetitle">
          <h1>My trips</h1>
          <div className="sub">Your requests and their live status. Updates automatically.</div>
        </div>

        {justSubmitted && (
          <div className="success-card">
            <b>Request sent ✓</b>
            <span className="small">
              The dispatcher will assign a driver. The badge turns <b>blue</b> when a driver is
              booked for you.
            </span>
          </div>
        )}

        <div className="card tight" style={{ marginBottom: 14 }}>
          <button className="linkbtn" onClick={() => setShowLegend(!showLegend)}>
            {showLegend ? "Hide" : "What do the colors mean?"}
          </button>
          {showLegend && (
            <div className="status-help" style={{ marginTop: 10 }}>
              {STATUSES.map((s) => (
                <div className="rowi" key={s.value}>
                  <span className={`badge badge-${s.tone}`}>{s.label}</span>
                  <span className="tx">{s.help}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!person && (
          <div className="empty">
            Pick your name on the <Link className="linkbtn" href="/">Request</Link> tab first.
          </div>
        )}
        {person && trips === null && <div className="empty">Loading your trips…</div>}
        {person && trips !== null && trips.length === 0 && (
          <div className="empty">
            No trips yet. Tap <Link className="linkbtn" href="/">Request</Link> to book your first ride.
          </div>
        )}

        {(trips || []).map((t) => (
          <TripRow key={t.id} trip={t} showDriver showDate>
            {t.driverName && (t.status === "ASSIGNED" || t.status === "EN_ROUTE") && (
              <span className="small muted">Driver: {t.driverName}{t.vehicleLabel ? ` · ${t.vehicleLabel}` : ""}</span>
            )}
            <span style={{ flex: 1 }} />
            {t.status !== "COMPLETED" && t.status !== "CANCELLED" && (
              <button className="btn btn-danger btn-sm" onClick={() => cancelReq(t.id)}>Cancel</button>
            )}
          </TripRow>
        ))}
      </div>
    </>
  );
}

export default function TripsPage() {
  return (
    <Suspense fallback={<div className="wrap"><div className="empty">Loading…</div></div>}>
      <TripsInner />
    </Suspense>
  );
}
