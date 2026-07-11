"use client";
import { useMemo, useState } from "react";

// Multi-select of people by name, with search + free-text add for non-staff.
export default function PassengerPicker({ people, value, onChange }) {
  const [q, setQ] = useState("");
  const selected = value || [];

  const suggestions = useMemo(() => {
    const query = q.trim().toLowerCase();
    const names = people.map((p) => p.name);
    const pool = query ? names.filter((n) => n.toLowerCase().includes(query)) : names;
    return pool.filter((n) => !selected.includes(n)).slice(0, 8);
  }, [q, people, selected]);

  function add(name) {
    const n = name.trim();
    if (!n || selected.includes(n)) return;
    onChange([...selected, n]);
    setQ("");
  }
  function remove(name) {
    onChange(selected.filter((n) => n !== name));
  }

  const canFreeAdd = q.trim() && !people.some((p) => p.name.toLowerCase() === q.trim().toLowerCase());

  return (
    <div>
      {selected.length > 0 && (
        <div className="chips" style={{ marginBottom: 8 }}>
          {selected.map((n) => (
            <span key={n} className="chip on" onClick={() => remove(n)}>
              {n} <span className="x">×</span>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder="Search names, or type a new one…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(q);
          }
        }}
      />
      {(suggestions.length > 0 || canFreeAdd) && (
        <div className="chips" style={{ marginTop: 8 }}>
          {suggestions.map((n) => (
            <span key={n} className="chip" onClick={() => add(n)}>
              + {n}
            </span>
          ))}
          {canFreeAdd && (
            <span className="chip" onClick={() => add(q)} style={{ borderStyle: "dashed" }}>
              + Add “{q.trim()}”
            </span>
          )}
        </div>
      )}
    </div>
  );
}
