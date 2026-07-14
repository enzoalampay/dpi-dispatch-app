"use client";
import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppBar from "../components/AppBar";
import TripRow from "../components/TripRow";
import PushToggle from "../components/PushToggle";
import { STATUSES } from "../../lib/constants";
import { prettyDate } from "../../lib/dates";
import { buildRequesterMessage, viberDeepLink } from "../../lib/viber";
import { usePolling } from "../../lib/usePolling";

function TripsInner() {
  const params = useSearchParams();
  const justSubmitted = params.get("submitted") === "1";
  const [person, setPerson] = useState("");
  const [trips, setTrips] = useState(null); // null = loading
  const [showLegend, setShowLegend] = useState(false);
  const [lastMsg, setLastMsg] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setPerson(localStorage.getItem("dispatch_person") || "");
    if (justSubmitted) {
      try { setLastMsg(sessionStorage.getItem("dispatch_last_request_msg") || ""); } catch {}
    }
  }, [justSubmitted]);

  function load() {
    if (!person) return;
    fetch(`/api/requests?requester=${encodeURIComponent(person)}&limit=50`)
      .then((r) => r.json())
      .then((d) => setTrips(d.requests || []))
      .catch(() => setTrips([]));
  }
  usePolling(load, 15000, [person]);

  function flash(m) { setToast(m); setTimeout(() => setToast(""), 2000); }

  // iOS clipboard rule: write synchronously in the tap handler, no awaits before it.
  function copy(msg) {
    try { navigator.clipboard.writeText(msg); flash("Message copied"); }
    catch { flash("Copy failed"); }
  }
  function copyTrip(t) {
    copy(buildRequesterMessage({
      requesterName: t.requesterName || person,
      dateLabel: prettyDate(t.serviceDate),
      timeNeeded: t.timeNeeded,
      endTime: t.endTime,
      type: t.type,
      pickupLocation: t.pickupLocation,
      destination: t.destination,
      passengers: t.passengers,
      purpose: t.purpose,
      baseUrl: window.location.origin,
    }));
  }

  // Optimistic cancel: badge flips immediately; roll back + toast on failure.
  async function cancelReq(id) {
    if (!confirm("Cancel this request?")) return;
    const prev = trips;
    setTrips((ts) => (ts || []).map((t) => (t.id === id ? { ...t, status: "CANCELLED" } : t)));
    try {
      const r = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: "CANCELLED" }),
      });
      if (!r.ok) throw new Error();
      load();
    } catch {
      setTrips(prev);
      flash("Couldn't cancel — try again");
    }
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
            {lastMsg && (
              <div className="btn-row" style={{ marginTop: 12 }}>
                <button className="btn btn-sm" onClick={() => copy(lastMsg)}>Copy message</button>
                <a className="btn btn-sm btn-accent" href={viberDeepLink(lastMsg)}>Open Viber</a>
              </div>
            )}
          </div>
        )}

        <PushToggle role="requester" personName={person} label="Notify me about my trips" />

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
          <TripRow key={t.id} trip={t} showDate>
            {t.driverName && t.status !== "CANCELLED" && (
              <span className="small muted">Driver: {t.driverName}{t.vehicleLabel ? ` · ${t.vehicleLabel}` : ""}</span>
            )}
            <span style={{ flex: 1 }} />
            <button className="btn btn-ghost btn-sm" onClick={() => copyTrip(t)}>Copy</button>
            {t.status !== "COMPLETED" && t.status !== "CANCELLED" && (
              <button className="btn btn-danger btn-sm" onClick={() => cancelReq(t.id)}>Cancel</button>
            )}
          </TripRow>
        ))}
      </div>
      {toast && <div className="toast">{toast}</div>}
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
