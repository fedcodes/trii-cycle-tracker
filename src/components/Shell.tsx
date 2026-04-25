"use client";

import { CYCLE } from "@/data/cycle";

export type TabKey = "Estado del ciclo" | "Discovery" | "Releases" | "Cooldown" | "Backlog";
export const TABS: TabKey[] = ["Estado del ciclo", "Discovery", "Releases", "Cooldown", "Backlog"];

export default function Shell({
  active,
  onNav,
  children,
}: {
  active: TabKey;
  onNav: (t: TabKey) => void;
  children: React.ReactNode;
}) {
  const pct = Math.round((CYCLE.currentWeek / CYCLE.totalWeeks) * 100);

  return (
    <div
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        background: "rgb(var(--bg))",
        color: "rgb(var(--fg))",
        fontFamily: "var(--font-sans)",
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <header
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 24,
          padding: "20px 28px 18px",
          borderBottom: "1px solid rgb(var(--surface-2))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "rgb(var(--primary))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgb(var(--bg))",
            }}
          >
            <svg width="14" height="21" viewBox="0 0 10.506 15.969" fill="currentColor">
              <path
                fillRule="nonzero"
                d="M 9.761 9.15 C 8.917 9.149 8.098 8.865 7.436 8.343 C 6.773 7.821 6.304 7.092 6.105 6.272 C 6.879 6.912 7.853 7.26 8.857 7.255 L 9.602 7.255 L 9.602 5.765 L 8.857 5.765 C 8.229 5.767 7.617 5.561 7.118 5.18 C 6.619 4.798 6.26 4.262 6.098 3.655 C 6.651 4.012 7.295 4.202 7.953 4.202 L 8.698 4.202 L 8.698 2.704 L 7.953 2.704 C 7.435 2.704 6.938 2.499 6.571 2.133 C 6.204 1.767 5.997 1.271 5.994 0.753 L 5.994 0 L 4.504 0 L 4.504 0.753 C 4.504 1.01 4.453 1.264 4.355 1.502 C 4.256 1.739 4.112 1.954 3.93 2.135 C 3.748 2.317 3.532 2.46 3.294 2.558 C 3.057 2.655 2.802 2.705 2.545 2.704 L 1.8 2.704 L 1.8 4.202 L 2.545 4.202 C 3.206 4.202 3.853 4.012 4.409 3.655 C 4.246 4.262 3.887 4.798 3.388 5.18 C 2.889 5.561 2.277 5.767 1.649 5.765 L 0.904 5.765 L 0.904 7.255 L 1.649 7.255 C 2.653 7.259 3.627 6.911 4.401 6.272 C 4.199 7.09 3.73 7.818 3.068 8.34 C 2.406 8.861 1.588 9.146 0.745 9.15 L 0 9.15 L 0 10.641 L 0.745 10.641 C 1.446 10.642 2.14 10.502 2.786 10.23 C 3.431 9.958 4.016 9.558 4.504 9.055 L 4.504 15.969 L 5.994 15.969 L 5.994 9.055 C 6.485 9.557 7.07 9.957 7.717 10.229 C 8.364 10.501 9.059 10.641 9.761 10.641 L 10.506 10.641 L 10.506 9.15 Z"
              />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.01em" }}>
              Cycle Tracker
            </div>
            <div style={{ fontSize: 11.5, color: "rgb(var(--fg-3))", marginTop: 1 }}>
              {CYCLE.cycleName} · {CYCLE.dates}
            </div>
          </div>
        </div>

        <nav style={{ display: "flex", gap: 2, justifyContent: "center" }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => onNav(t)}
              style={{
                background: t === active ? "rgb(var(--surface-1))" : "transparent",
                border: "none",
                color: t === active ? "rgb(var(--fg))" : "rgb(var(--fg-3))",
                fontFamily: "inherit",
                fontSize: 12.5,
                fontWeight: 500,
                padding: "7px 14px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {t}
            </button>
          ))}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10.5,
                color: "rgb(var(--fg-3))",
                fontWeight: 500,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              Semana {CYCLE.currentWeek} / {CYCLE.totalWeeks}
            </div>
            <div style={{ fontSize: 11, color: "rgb(var(--fg-4))", marginTop: 2 }}>
              Última: {CYCLE.lastUpdated}
            </div>
          </div>
          <div
            style={{
              position: "relative",
              width: 72,
              height: 28,
              background: "rgb(var(--surface-1))",
              borderRadius: 6,
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${pct}%`,
                background: "rgb(var(--primary-dim))",
              }}
            />
            <span
              style={{
                position: "relative",
                fontSize: 12,
                fontWeight: 700,
                color: "rgb(var(--primary))",
              }}
            >
              {pct}%
            </span>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
