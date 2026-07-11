import Link from "next/link";

// Presentational only — safe to use in server or client components.
export default function AppBar({ title = "DPI Dispatch", right = null, wide = false, href = "/" }) {
  return (
    <div className="appbar">
      <div className={wide ? "appbar-inner" : ""} style={wide ? {} : { width: "100%", display: "flex", alignItems: "center", gap: 10 }}>
        <Link href={href} className="brand" style={{ textDecoration: "none", color: "inherit" }}>
          <span className="dot" />
          {title}
        </Link>
        <span className="spacer" />
        {right}
      </div>
    </div>
  );
}
