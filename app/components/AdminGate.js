"use client";
import { useEffect, useState } from "react";
import AppBar from "./AppBar";

// Wraps admin screens. Renders a passcode form until verified, then calls
// children(passcode). Passcode is remembered on the device.
export default function AdminGate({ children }) {
  const [pass, setPass] = useState(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function verify(p) {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/admin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: p }),
      });
      const d = await r.json();
      if (d.ok) {
        setPass(p);
        localStorage.setItem("dispatch_admin_pass", p);
      } else {
        setError("Wrong passcode.");
        localStorage.removeItem("dispatch_admin_pass");
      }
    } catch {
      setError("Could not verify.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("dispatch_admin_pass");
    if (saved) verify(saved);
  }, []);

  if (pass) return children(pass);

  return (
    <>
      <AppBar title="Dispatcher" />
      <div className="wrap">
        <div className="pagetitle">
          <h1>Dispatcher access</h1>
          <div className="sub">Enter the shared passcode to manage dispatches.</div>
        </div>
        <div className="card">
          {error && <div className="error">{error}</div>}
          <div className="field">
            <label>Passcode</label>
            <input
              type="password"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && verify(input)}
              placeholder="••••••"
              autoFocus
            />
          </div>
          <button className="btn btn-primary btn-block" onClick={() => verify(input)} disabled={busy}>
            {busy ? "Checking…" : "Enter"}
          </button>
        </div>
      </div>
    </>
  );
}
