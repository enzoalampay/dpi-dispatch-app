"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppBar from "./components/AppBar";
import PassengerPicker from "./components/PassengerPicker";
import { REQUEST_TYPES } from "../lib/constants";
import { todayYMD, addDaysYMD } from "../lib/dates";
import { toMinutes, overlaps } from "../lib/conflicts";
import { minToHHMM, durationFrom, durationLabel } from "../lib/time";

export default function RequestPage() {
  const router = useRouter();
  const [people, setPeople] = useState(null); // null = loading
  const [drivers, setDrivers] = useState([]);
  const [daySched, setDaySched] = useState([]);
  const [person, setPerson] = useState("");
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const blank = useMemo(
    () => ({
      serviceDate: todayYMD(),
      timeNeeded: "08:00",
      endTime: "",
      type: "SITE_MOBILIZATION",
      pickupLocation: "",
      destination: "",
      passengers: [],
      purpose: "",
      equipment: "",
    }),
    []
  );
  const [form, setForm] = useState(blank);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((d) => setPeople(d.people || []))
      .catch(() => setPeople([]));
    fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || [])).catch(() => {});
    const saved = localStorage.getItem("dispatch_person");
    if (saved) setPerson(saved);
  }, []);

  useEffect(() => {
    if (person) localStorage.setItem("dispatch_person", person);
  }, [person]);

  // day's committed trips → who is free around the requested time
  useEffect(() => {
    fetch(`/api/requests?date=${form.serviceDate}`)
      .then((r) => r.json())
      .then((d) => setDaySched(d.requests || []))
      .catch(() => {});
  }, [form.serviceDate]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  // pre-fill self as first passenger
  useEffect(() => {
    if (person && form.passengers.length === 0) set("passengers", [person]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [person]);

  const freeInfo = useMemo(() => {
    const s = toMinutes(form.timeNeeded);
    if (s == null || drivers.length === 0) return null;
    const reqDur = form.endTime ? durationFrom(form.timeNeeded, form.endTime, 60) : 60;
    const busy = new Set();
    for (const r of daySched) {
      if (!r.driverId || r.status === "CANCELLED") continue;
      const bs = toMinutes(r.scheduledTime || r.timeNeeded);
      if (bs != null && overlaps(s, reqDur, bs, r.estDurationMin || 60)) busy.add(r.driverId);
    }
    return {
      free: drivers.filter((d) => !busy.has(d.id)).map((d) => d.name),
      occupied: drivers.filter((d) => busy.has(d.id)).map((d) => d.name),
    };
  }, [form.timeNeeded, form.endTime, daySched, drivers]);

  function setEndPreset(minutes) {
    const s = toMinutes(form.timeNeeded);
    if (s == null) return;
    set("endTime", minToHHMM(s + minutes));
  }

  async function submit() {
    setError("");
    if (!person) return setError("Pick your name first.");
    if (!form.pickupLocation.trim()) return setError("Where should the driver pick you up?");
    if (!form.destination.trim()) return setError("Where are you going?");
    setSaving(true);
    try {
      const r = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, requesterName: person }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not send the request");
      router.push("/trips?submitted=1");
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  const loadingPeople = people === null;
  const names = people || [];
  const knownPerson = !!person && !changing;
  const dateChips = [
    { label: "Today", ymd: todayYMD() },
    { label: "Tomorrow", ymd: addDaysYMD(todayYMD(), 1) },
  ];

  // ---------- first run: welcome ----------
  if (!knownPerson) {
    return (
      <>
        <AppBar />
        <div className="wrap">
          <div className="pagetitle">
            <h1>Welcome 👋</h1>
            <div className="sub">
              This is the DPI ride and dispatch app. You ask for a ride, the dispatcher assigns a
              driver, and you can see the whole day&apos;s schedule. No account needed.
            </div>
          </div>
          <div className="card">
            <div className="field" style={{ marginBottom: 8 }}>
              <label>Who are you?</label>
              <select value={person} onChange={(e) => { setPerson(e.target.value); setChanging(false); }}>
                <option value="">{loadingPeople ? "Loading names…" : "— select your name —"}</option>
                {names.map((p) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
              <div className="hint" style={{ marginTop: 10, marginBottom: 0 }}>
                Your phone remembers this — you only pick it once.
              </div>
            </div>
          </div>
          <div className="small muted" style={{ textAlign: "center", marginTop: 14 }}>
            New here? <Link className="linkbtn" href="/guide">Read the 2-minute guide</Link>
          </div>
        </div>
      </>
    );
  }

  // ---------- main: request form ----------
  return (
    <>
      <AppBar />
      <div className="wrap">
        <div className="pagetitle">
          <h1>Request a ride</h1>
          <div className="sub">The dispatcher will assign a driver and you&apos;ll see it in My trips.</div>
        </div>

        <div className="identity">
          Requesting as <b>{person}</b>
          <button className="linkbtn" onClick={() => setChanging(true)}>Change</button>
        </div>

        <div className="card">
          {error && <div className="error">{error}</div>}

          <div className="field">
            <label>Date</label>
            <div className="chips" style={{ marginBottom: 8 }}>
              {dateChips.map((c) => (
                <span
                  key={c.label}
                  className={`chip ${form.serviceDate === c.ymd ? "on" : ""}`}
                  onClick={() => set("serviceDate", c.ymd)}
                >
                  {c.label}
                </span>
              ))}
            </div>
            <input type="date" value={form.serviceDate} onChange={(e) => set("serviceDate", e.target.value)} />
          </div>

          <div className="row">
            <div className="field">
              <label>Start time</label>
              <input type="time" value={form.timeNeeded} onChange={(e) => set("timeNeeded", e.target.value)} />
            </div>
            <div className="field">
              <label>Until <span className="muted small">(optional)</span></label>
              <input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginTop: -6 }}>
            <div className="chips">
              <span className="chip" onClick={() => setEndPreset(60)}>1 hr</span>
              <span className="chip" onClick={() => setEndPreset(240)}>Half day</span>
              <span className="chip" onClick={() => setEndPreset(480)}>Whole day</span>
              {form.endTime && <span className="chip" onClick={() => set("endTime", "")}>Clear</span>}
            </div>
            {form.endTime && (
              <div className="hint" style={{ marginTop: 8, marginBottom: 0 }}>
                Needed {form.timeNeeded}–{form.endTime} · <b>{durationLabel(durationFrom(form.timeNeeded, form.endTime, 60))}</b>
              </div>
            )}
          </div>

          {freeInfo && (
            <div className="hint">
              Around {form.timeNeeded}:{" "}
              {freeInfo.free.length ? (
                <><b>{freeInfo.free.length} driver{freeInfo.free.length === 1 ? "" : "s"} free</b> — {freeInfo.free.join(", ")}</>
              ) : (
                <b>no drivers free</b>
              )}
              {freeInfo.occupied.length ? <> · busy: {freeInfo.occupied.join(", ")}</> : null}{" "}
              <Link className="linkbtn" href={`/schedule?date=${form.serviceDate}`}>See schedule →</Link>
            </div>
          )}

          <div className="field">
            <label>Pick-up location</label>
            <input type="text" placeholder="e.g. DPI Office, Marikina, NAIA T3" value={form.pickupLocation} onChange={(e) => set("pickupLocation", e.target.value)} />
          </div>

          <div className="field">
            <label>Destination</label>
            <input type="text" placeholder="e.g. Imus Cavite site, Ayala Makati" value={form.destination} onChange={(e) => set("destination", e.target.value)} />
          </div>

          <div className="field">
            <label>What for</label>
            <select value={form.type} onChange={(e) => set("type", e.target.value)}>
              {REQUEST_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label>Who&apos;s going</label>
            <PassengerPicker people={names} value={form.passengers} onChange={(v) => set("passengers", v)} />
          </div>

          <details className="form-details">
            <summary>+ Add details (optional)</summary>
            <div className="inner">
              <div className="hint" style={{ marginBottom: 12 }}>The driver will see this.</div>
              <div className="field">
                <label>Purpose / notes</label>
                <input type="text" placeholder="e.g. GPR mobilization, client meeting" value={form.purpose} onChange={(e) => set("purpose", e.target.value)} />
              </div>
              <div className="field" style={{ marginBottom: 4 }}>
                <label>Equipment to bring</label>
                <input type="text" placeholder="e.g. Leica scanner, GPR cart" value={form.equipment} onChange={(e) => set("equipment", e.target.value)} />
              </div>
            </div>
          </details>

          <button className="btn btn-primary btn-block" style={{ minHeight: 52, fontSize: 16 }} onClick={submit} disabled={saving}>
            {saving ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </>
  );
}
