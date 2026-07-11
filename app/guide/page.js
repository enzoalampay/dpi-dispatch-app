import Link from "next/link";
import AppBar from "../components/AppBar";
import { STATUSES } from "../../lib/constants";

export const metadata = { title: "How it works — DPI Dispatch" };

function Step({ children }) {
  return (
    <div className="guide-step">
      <div className="tx">{children}</div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <>
      <AppBar />
      <div className="wrap">
        <div className="pagetitle">
          <h1>How it works</h1>
          <div className="sub">A 2-minute guide to the DPI Dispatch app.</div>
        </div>

        <div className="guide-section">
          <div className="card">
            <p style={{ margin: 0 }}>
              <b>You ask for a ride. The dispatcher assigns a driver. The driver takes you.</b>
              <br />
              <span className="muted small">
                Three roles: staff who request rides, the dispatcher who plans the day, and the
                drivers. No account or password needed for staff and drivers.
              </span>
            </p>
          </div>
        </div>

        <div className="guide-section">
          <h2>Requesting a ride</h2>
          <div className="guide-steps">
            <Step>Open the <b>Request</b> tab. The first time, pick your name — your phone remembers it.</Step>
            <Step>Choose the <b>date and start time</b>. Add an end time if you need the driver for longer (half day, whole day).</Step>
            <Step>Type <b>where to pick you up</b> and <b>where you&apos;re going</b>. Add companions under &quot;Who&apos;s going&quot;.</Step>
            <Step>Tap <b>Send request</b>. You&apos;ll land on <b>My trips</b> — watch the badge there.</Step>
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            Tip: before requesting, check the <b>Schedule</b> tab to see which drivers are free at
            your time. The form also tells you who&apos;s free.
          </div>
        </div>

        <div className="guide-section">
          <h2>What the colors mean</h2>
          <div className="card">
            <div className="status-help">
              {STATUSES.map((s) => (
                <div className="rowi" key={s.value}>
                  <span className={`badge badge-${s.tone}`}>{s.label}</span>
                  <span className="tx">{s.help}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h2>For drivers</h2>
          <div className="guide-steps">
            <Step>You have a <b>personal page</b> with your trips for the day. Find it under <b>More → My driver schedule</b> — tap your name once and your phone remembers it.</Step>
            <Step>Each trip shows the time, pick-up, passengers, and destination. Tap <b>📍 Pickup</b> or <b>📍 Drop-off</b> to open Google Maps.</Step>
            <Step>Tap <b>Start trip</b> when you leave, and <b>Mark done</b> when finished — the requester sees this live.</Step>
          </div>
        </div>

        <div className="guide-section">
          <h2>For the dispatcher</h2>
          <div className="guide-steps">
            <Step>Open <b>More → Dispatcher board</b> and enter the passcode once. A <b>Dispatch</b> tab then appears in your menu.</Step>
            <Step>New requests appear in <b>Incoming</b>. Tap <b>Assign</b>, pick a driver, vehicle, and time. The app <b>warns you if the driver or vehicle is double-booked</b>.</Step>
            <Step>Use the <b>Calendar</b> toggle to see the whole day visually. Tap any block to edit it.</Step>
            <Step>Tap <b>+ Standing trips</b> each morning to add the daily shuttles automatically.</Step>
            <Step>Tap <b>Viber</b> next to a driver&apos;s name to send them their day&apos;s plan with one tap.</Step>
          </div>
        </div>

        <div className="guide-section">
          <h2>Common questions</h2>
          <div className="faq">
            <div className="qa">
              <div className="q">Can I cancel a request?</div>
              <div className="a">Yes — open My trips and tap Cancel, any time before the trip is completed.</div>
            </div>
            <div className="qa">
              <div className="q">No driver is free at my time. What do I do?</div>
              <div className="a">Pick another time if you can, or send the request anyway — the dispatcher decides and may rearrange trips.</div>
            </div>
            <div className="qa">
              <div className="q">Can I book for a visitor or client?</div>
              <div className="a">Yes — in &quot;Who&apos;s going&quot;, type any name and tap Add.</div>
            </div>
            <div className="qa">
              <div className="q">Do I need an account or password?</div>
              <div className="a">No. Only the dispatcher has a passcode.</div>
            </div>
          </div>
        </div>

        <div className="guide-section">
          <h2>Put it on your phone</h2>
          <div className="card">
            <p className="small" style={{ marginTop: 0 }}>
              <b>Android (Chrome):</b> open this app → tap the <b>⋮</b> menu → <b>Add to Home
              screen</b> → Add. It opens like a normal app.
            </p>
            <p className="small" style={{ marginBottom: 0 }}>
              <b>iPhone (Safari):</b> open this app → tap the <b>Share</b> button → <b>Add to Home
              Screen</b> → Add.
            </p>
          </div>
        </div>

        <div className="small muted" style={{ textAlign: "center", marginTop: 18 }}>
          Questions? Message the dispatcher. · <Link className="linkbtn" href="/">Request a ride →</Link>
        </div>
      </div>
    </>
  );
}
