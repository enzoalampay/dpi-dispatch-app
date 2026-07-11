"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Minimal inline icons (stroke style, inherit currentColor).
const I = {
  request: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </svg>
  ),
  trips: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h-1a1 1 0 0 1-1-1v-4l2-5a2 2 0 0 1 1.9-1.3h10.2A2 2 0 0 1 19 7l2 5v4a1 1 0 0 1-1 1h-1" />
      <circle cx="7.5" cy="17" r="1.8" />
      <circle cx="16.5" cy="17" r="1.8" />
      <path d="M3 12h18" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </svg>
  ),
  dispatch: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16M4 12h10M4 18h7" />
      <circle cx="18.5" cy="16.5" r="3" />
      <path d="M18.5 15.2v1.3l1 1" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  ),
};

export default function BottomNav() {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Aji's device remembers the passcode → she gets a one-tap Dispatch tab.
    setIsAdmin(!!localStorage.getItem("dispatch_admin_pass"));
  }, [pathname]);

  const tabs = [
    { href: "/", label: "Request", icon: I.request, active: pathname === "/" },
    { href: "/trips", label: "My trips", icon: I.trips, active: pathname === "/trips" },
    { href: "/schedule", label: "Schedule", icon: I.schedule, active: pathname === "/schedule" },
  ];
  if (isAdmin) {
    tabs.push({ href: "/dispatch", label: "Dispatch", icon: I.dispatch, active: pathname.startsWith("/dispatch") });
  }
  const ownedElsewhere = tabs.some((t) => t.active);
  tabs.push({ href: "/more", label: "More", icon: I.more, active: !ownedElsewhere });

  return (
    <nav className="bottomnav">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={t.active ? "active" : ""}>
          {t.icon}
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
