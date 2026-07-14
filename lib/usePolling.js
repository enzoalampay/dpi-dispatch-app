"use client";
import { useEffect, useRef } from "react";

// Polls fn() every `ms`, but pauses while the tab is hidden (saves battery/data
// on installed PWAs) and refetches immediately when the tab becomes visible again.
// `deps` re-arms the timer when they change (e.g. the selected date).
export function usePolling(fn, ms, deps = []) {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    let id = null;
    const tick = () => { if (!document.hidden) saved.current(); };
    const start = () => { if (id == null) id = setInterval(tick, ms); };
    const stop = () => { if (id != null) { clearInterval(id); id = null; } };

    saved.current(); // initial load
    start();
    const onVis = () => {
      if (document.hidden) { stop(); }
      else { saved.current(); start(); }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => { stop(); document.removeEventListener("visibilitychange", onVis); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ms, ...deps]);
}
