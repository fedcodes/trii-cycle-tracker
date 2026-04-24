"use client";

import { RELEASES, Release } from "@/data/cycle";

function Pill({ fg, children }: { fg: "yellow" | "primary" | "fg-3"; children: React.ReactNode }) {
  const styleMap = {
    yellow: { bg: "rgb(var(--yellow-dim))", color: "rgb(var(--yellow))" },
    primary: { bg: "rgb(var(--primary-dim))", color: "rgb(var(--primary))" },
    "fg-3": { bg: "rgb(var(--surface-2))", color: "rgb(var(--fg-3))" },
  };
  const s = styleMap[fg];
  return (
    <span
      style={{
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.08em",
        padding: "3px 7px",
        borderRadius: 3,
        textTransform: "uppercase",
        background: s.bg,
        color: s.color,
      }}
    >
      {children}
    </span>
  );
}

function VersionTag({ tag, first }: { tag?: string; first: boolean }) {
  if (tag === "QA") return <Pill fg="yellow">En QA</Pill>;
  if (tag === "Live") return <Pill fg="primary">Live</Pill>;
  if (first) return <Pill fg="primary">Prod</Pill>;
  return <Pill fg="fg-3">Prod</Pill>;
}

function ReleaseCard({
  release,
  isFirst,
  isLast,
}: {
  release: Release;
  isFirst: boolean;
  isLast: boolean;
}) {
  const isQA = release.tag === "QA";
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "140px 1fr",
        gap: 0,
        position: "relative",
      }}
    >
      <div
        style={{
          position: "relative",
          padding: "18px 18px 18px 28px",
          borderRight: "1px solid rgb(var(--surface-2))",
        }}
      >
        {!isFirst && (
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 0,
              height: 24,
              width: 1,
              background: "rgb(var(--surface-2))",
            }}
          />
        )}
        {!isLast && (
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 24,
              bottom: 0,
              width: 1,
              background: "rgb(var(--surface-2))",
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            left: 30,
            top: 20,
            width: 9,
            height: 9,
            borderRadius: "50%",
            background: isQA
              ? "rgb(var(--yellow))"
              : isFirst
                ? "rgb(var(--primary))"
                : "rgb(var(--fg-3))",
            border: `2px solid rgb(var(--bg))`,
            boxShadow: isQA
              ? "0 0 0 3px rgb(var(--yellow) / 0.2)"
              : isFirst
                ? "0 0 0 3px rgb(var(--primary) / 0.2)"
                : "none",
          }}
        />
        <div style={{ paddingLeft: 18 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "-0.01em",
              color: "rgb(var(--fg))",
            }}
          >
            v{release.version}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "rgb(var(--fg-3))",
              marginTop: 2,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {release.date} · 2026
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "18px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <VersionTag tag={release.tag} first={isFirst} />
          <span style={{ fontSize: 11, color: "rgb(var(--fg-3))", fontWeight: 500 }}>
            {release.items.length} cambio{release.items.length === 1 ? "" : "s"}
          </span>
        </div>
        <ul
          style={{
            listStyle: "none",
            padding: 0,
            margin: 0,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {release.items.map((it, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                fontSize: 12,
                color: "rgb(var(--fg-2))",
                lineHeight: 1.45,
              }}
            >
              <span
                style={{
                  color: "rgb(var(--fg-4))",
                  marginTop: 1,
                  flexShrink: 0,
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                ·
              </span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ReleasesSummary() {
  const total = RELEASES.length;
  const qa = RELEASES.filter((r) => r.tag === "QA").length;
  const itemsThisCycle = RELEASES.slice(0, 3).reduce((s, r) => s + r.items.length, 0);
  const nextRelease = RELEASES.find((r) => r.tag === "QA")?.version || "—";

  const items = [
    { label: "Releases totales", value: total, sub: "últimos 6 meses", accent: "rgb(var(--fg))", isText: false },
    { label: "En QA hoy", value: qa, sub: qa === 0 ? "ninguno" : "v3.2.1", accent: "rgb(var(--yellow))", isText: false },
    { label: "Cambios en el ciclo", value: itemsThisCycle, sub: "últimas 3 versiones", accent: "rgb(var(--primary))", isText: false },
    { label: "Próximo release", value: `v${nextRelease}`, sub: "esperado S6-S7", accent: "rgb(var(--fg-2))", isText: true },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        borderBottom: "1px solid rgb(var(--surface-2))",
      }}
    >
      {items.map((it, i) => (
        <div
          key={it.label}
          style={{
            padding: "14px 20px",
            borderLeft: i === 0 ? "none" : "1px solid rgb(var(--surface-2))",
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: "rgb(var(--fg-3))",
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {it.label}
          </div>
          <div
            style={{
              fontSize: it.isText ? 20 : 26,
              fontWeight: 700,
              marginTop: 4,
              color: it.accent,
              letterSpacing: "-0.02em",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {it.value}
          </div>
          <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>{it.sub}</div>
        </div>
      ))}
    </div>
  );
}

const LegendChip = ({ c, label }: { c: string; label: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10.5,
      color: "rgb(var(--fg-3))",
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
    {label}
  </span>
);

export default function ReleasesTab() {
  return (
    <>
      <ReleasesSummary />
      <div style={{ padding: "18px 28px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: 14,
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Historial de releases</div>
            <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
              Versiones publicadas desde Feb 2026 · mobile + web
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <LegendChip c="rgb(var(--yellow))" label="En QA" />
            <LegendChip c="rgb(var(--primary))" label="Live / reciente" />
            <LegendChip c="rgb(var(--fg-3))" label="Prod anterior" />
          </div>
        </div>
        <div
          style={{
            background: "rgb(var(--surface-1))",
            border: "1px solid rgb(var(--surface-2))",
            borderRadius: 10,
            overflow: "hidden",
          }}
        >
          {RELEASES.map((r, i) => (
            <div
              key={r.version}
              style={{
                borderBottom:
                  i === RELEASES.length - 1
                    ? "none"
                    : "1px solid rgb(var(--surface-2) / 0.5)",
              }}
            >
              <ReleaseCard
                release={r}
                isFirst={i === 0}
                isLast={i === RELEASES.length - 1}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
