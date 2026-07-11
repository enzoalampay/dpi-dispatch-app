"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppBar from "../components/AppBar";
import DayCalendar, { CalendarLegend } from "../components/DayCalendar";
import { todayYMD, prettyDate, addDaysYMD } from "../../lib/dates";

function ScheduleInner() {
  const params = useSearchParams();
  const [date, setDate] = useState(params.get("date") || todayYMD());
  const [drivers, setDrivers] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetch("/api/people?drivers=1").then((r) => r.json()).then((d) => setDrivers(d.people || [])).catch(() => {});
  }, []);

  function load() {
    fetch(`/api/requests?date=${date}`).then((r) => r.json()).then((d) => setRequests(d.requests || [])).catch(() => {});
  }
  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const assignedCount = requests.filter((r) => r.driverId && r.status !== "CANCELLED").length;

  return (
    <>
      <AppBar title="Driver schedule" wide />
      <div className="wrap-wide">
        <div className="pagetitle">
          <h1>Who's driving, and when</h1>
          <div className="sub">See where drivers are committed before you make a request.</div>
        </div>

        <div className="daynav">
          <button className="btn btn-sm" onClick={() => setDate(addDaysYMD(date, -1))}>‹</button>
          <div className="label">{prettyDate(date)}{date === todayYMD() ? " · Today" : ""}</div>
          <button className="btn btn-sm" onClick={() => setDate(addDaysYMD(date, 1))}>›</button>
          <button className="btn btn-sm" onClick={() => setDate(todayYMD())}>Today</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ maxWidth: 170 }} />
        </div>

        <CalendarLegend />
        <DayCalendar date={date} drivers={drivers} requests={requests} includeUnassigned />

        <div className="small muted" style={{ marginTop: 12 }}>
          {assignedCount} trip{assignedCount === 1 ? "" : "s"} scheduled. Empty columns = free all
          day. Tap a block for details. This view updates automatically.
        </div>
      </div>
    </>
  );
}

export default function SchedulePage() {
  return (
    <Suspense fallback={<div className="wrap"><div className="empty">Loading…</div></div>}>
      <ScheduleInner />
    </Suspense>
  );
}
