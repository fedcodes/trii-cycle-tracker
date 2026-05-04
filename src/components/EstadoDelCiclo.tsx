"use client";

import { useState, useEffect } from "react";
import {
  BETS,
  WEEKLY_LOG,
  CYCLE,
  TOTAL_DAYS,
  weekToDays,
  objColor,
  objShort,
  statusToken,
  getKPIs,
  Bet,
  BetStatus,
} from "@/data/cycle";

const StatusDot = ({
  status,
  dropped,
  size = 8,
}: {
  status: BetStatus;
  dropped?: boolean;
  size?: number;
}) => {
  const t = statusToken(status, dropped);
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        background: t.dot,
        flexShrink: 0,
      }}
    />
  );
};

const TeamStack = ({ team }: { team: string[] }) => (
  <span style={{ display: "inline-flex" }}>
    {team.map((t, i) => (
      <span
        key={t}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "rgb(var(--surface-2))",
          color: "rgb(var(--fg))",
          fontSize: 9,
          fontWeight: 600,
          border: "1.5px solid rgb(var(--surface-1))",
          marginLeft: i === 0 ? 0 : -6,
        }}
      >
        {t}
      </span>
    ))}
    {team.length === 0 && (
      <span style={{ fontSize: 10, color: "rgb(var(--fg-4))", fontStyle: "italic" }}>
        sin equipo
      </span>
    )}
  </span>
);

const ObjChip = ({ num }: { num: number }) => {
  const c = objColor(num);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "0.04em",
        color: "rgb(var(--fg-2))",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
      {objShort(num)}
    </span>
  );
};

function KPIStrip() {
  const k = getKPIs();
  const completedPct = Math.round((k.listo / k.total) * 100);
  const atRiskCount = k.update + BETS.filter((b) => b.status === "Blocked").length;

  const items = [
    { label: "Bets activas", value: k.total, sub: `${k.dropped} descartadas`, accent: "rgb(var(--fg))" },
    { label: "On track", value: k.onTrack, sub: `${Math.round((k.onTrack / k.total) * 100)}% del ciclo`, accent: "rgb(var(--primary))" },
    { label: "Listas", value: k.listo, sub: `${completedPct}% completado`, accent: "rgb(var(--primary))" },
    { label: "Necesita atención", value: atRiskCount, sub: "Updates + blockers", accent: "rgb(var(--yellow))" },
    { label: "Sin arrancar", value: k.notStarted, sub: "Pendientes", accent: "rgb(var(--fg-2))" },
    { label: "Releases en QA", value: 1, sub: "v3.2.1 · hoy", accent: "rgb(var(--yellow))" },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(6, 1fr)",
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
              fontSize: 26,
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

const LegendDot = ({ c, label }: { c: string; label: string }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10.5,
      color: "rgb(var(--fg-3))",
    }}
  >
    <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
    {label}
  </span>
);

function Gantt({ onSelect }: { onSelect: (b: Bet) => void }) {
  const leftW = 300;
  const currentDayIdx = (CYCLE.currentWeek - 1) * 7 + 4;

  return (
    <div
      style={{
        background: "rgb(var(--surface-1))",
        borderRadius: 10,
        overflow: "hidden",
        border: "1px solid rgb(var(--surface-2))",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          padding: "14px 18px 10px",
          borderBottom: "1px solid rgb(var(--surface-2))",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: "-0.005em" }}>
            Bets del ciclo
          </div>
          <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
            {BETS.length} proyectos · {CYCLE.dates.replace(", 2026", "")} · click para ver detalle
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <LegendDot c="rgb(var(--obj-1))" label="Pro" />
          <LegendDot c="rgb(var(--obj-2))" label="US Stocks" />
          <LegendDot c="rgb(var(--obj-3))" label="Chile" />
          <LegendDot c="rgb(var(--obj-4))" label="Activación" />
          <LegendDot c="rgb(var(--obj-99))" label="Regulatorio" />
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: `${leftW}px 1fr`,
          borderBottom: "1px solid rgb(var(--surface-2))",
          background: "rgb(var(--surface-0))",
        }}
      >
        <div
          style={{
            padding: "8px 18px",
            fontSize: 10,
            fontWeight: 600,
            color: "rgb(var(--fg-3))",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            borderRight: "1px solid rgb(var(--surface-2))",
            display: "flex",
            alignItems: "center",
          }}
        >
          Proyecto / equipo
        </div>
        <div style={{ position: "relative", height: 30, overflow: "hidden" }}>
          {[1, 2, 3, 4, 5, 6].map((w) => {
            const isCurrent = w === CYCLE.currentWeek;
            const monthStart = new Date(2026, 2, 16);
            const { start } = weekToDays(w);
            const d = new Date(monthStart);
            d.setDate(d.getDate() + start);
            const monthStr = d
              .toLocaleDateString("es", { month: "short" })
              .replace(".", "");
            const dayStr = d.getDate();
            return (
              <div
                key={w}
                style={{
                  position: "absolute",
                  left: `${((w - 1) / 6) * 100}%`,
                  width: `${(1 / 6) * 100}%`,
                  top: 0,
                  height: 30,
                  borderRight: w < 6 ? "1px solid rgb(var(--surface-2))" : "none",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  paddingLeft: 10,
                  background: isCurrent ? "rgb(var(--primary) / 0.06)" : "transparent",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isCurrent ? "rgb(var(--primary))" : "rgb(var(--fg-2))",
                    letterSpacing: "0.02em",
                  }}
                >
                  S{w}{" "}
                  <span style={{ color: "rgb(var(--fg-4))", fontWeight: 500 }}>
                    · {monthStr} {dayStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        {BETS.map((bet, i) => (
          <GanttRow
            key={bet.id}
            bet={bet}
            leftW={leftW}
            currentDayIdx={currentDayIdx}
            isLast={i === BETS.length - 1}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}

function GanttRow({
  bet,
  leftW,
  currentDayIdx,
  isLast,
  onSelect,
}: {
  bet: Bet;
  leftW: number;
  currentDayIdx: number;
  isLast: boolean;
  onSelect: (b: Bet) => void;
}) {
  const obj = objColor(bet.objectiveNum);
  const wkS = weekToDays(bet.weeks[0]);
  const wkE = weekToDays(bet.weeks[1]);
  const toPct = (day: number) => (day / TOTAL_DAYS) * 100;
  const barLeftPct = toPct(wkS.start);
  const barWidthPct = toPct(wkE.end - wkS.start + 1);
  const [hover, setHover] = useState(false);

  const barBg = bet.dropped
    ? "rgb(var(--surface-2))"
    : bet.status === "Listo"
      ? obj
      : bet.status === "Update"
        ? "rgb(var(--yellow-dim))"
        : bet.status === "Not started"
          ? "rgb(var(--surface-2))"
          : `color-mix(in oklab, ${obj} 20%, transparent)`;

  const barBorder =
    bet.status === "Not started" || bet.dropped
      ? "1px dashed rgb(var(--fg-4))"
      : `1px solid ${obj}`;

  return (
    <div
      onClick={() => onSelect(bet)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "grid",
        gridTemplateColumns: `${leftW}px 1fr`,
        borderBottom: isLast ? "none" : "1px solid rgb(var(--surface-2) / 0.6)",
        minHeight: 44,
        cursor: "pointer",
        background: hover ? "rgb(var(--surface-2) / 0.3)" : "transparent",
        transition: "background 0.12s ease",
      }}
    >
      <div
        style={{
          padding: "8px 18px 8px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 3,
          borderLeft: `3px solid ${obj}`,
          borderRight: "1px solid rgb(var(--surface-2))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <StatusDot status={bet.status} dropped={bet.dropped} />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 600,
              color: bet.dropped ? "rgb(var(--fg-4))" : "rgb(var(--fg))",
              textDecoration: bet.dropped ? "line-through" : "none",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {bet.name}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 10.5,
            color: "rgb(var(--fg-3))",
          }}
        >
          <ObjChip num={bet.objectiveNum} />
          <span style={{ color: "rgb(var(--fg-4))" }}>·</span>
          <TeamStack team={bet.team} />
        </div>
      </div>

      <div style={{ position: "relative", overflow: "hidden" }}>
        {[1, 2, 3, 4, 5].map((w) => (
          <div
            key={w}
            style={{
              position: "absolute",
              left: `${(w / 6) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgb(var(--surface-2) / 0.6)",
            }}
          />
        ))}
        {[0, 1, 2, 3, 4, 5].map((w) => (
          <div
            key={w}
            style={{
              position: "absolute",
              left: `${toPct(w * 7 + 5)}%`,
              top: 0,
              bottom: 0,
              width: `${toPct(2)}%`,
              background: "rgb(var(--bg) / 0.3)",
            }}
          />
        ))}
        <div
          style={{
            position: "absolute",
            left: `${toPct(currentDayIdx + 0.5)}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: "rgb(var(--primary))",
            boxShadow: "0 0 8px rgb(var(--primary) / 0.4)",
            zIndex: 3,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: `calc(${barLeftPct}% + 3px)`,
            top: "50%",
            width: `calc(${barWidthPct}% - 6px)`,
            transform: "translateY(-50%)",
            height: 22,
            borderRadius: 4,
            background: barBg,
            border: barBorder,
            overflow: "hidden",
            opacity: bet.dropped ? 0.4 : 1,
          }}
        >
          {!bet.dropped && bet.status !== "Listo" && bet.progress > 0 && bet.progress < 1 && (
            <div
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                width: `${bet.progress * 100}%`,
                background:
                  bet.status === "Update" ? "rgb(var(--yellow) / 0.5)" : obj,
                opacity: 0.55,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              paddingLeft: 10,
              paddingRight: 8,
              fontSize: 10.5,
              fontWeight: 600,
              color: bet.status === "Listo"
                ? "rgb(var(--bg))"
                : bet.dropped
                  ? "rgb(var(--fg-4))"
                  : "rgb(var(--fg))",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontVariantNumeric: "tabular-nums",
              zIndex: 2,
            }}
          >
            {!bet.dropped && bet.status !== "Not started" && (
              <span>{Math.round((bet.progress || 0) * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function WeeklyLog() {
  const [expanded, setExpanded] = useState(0);

  return (
    <div
      style={{
        background: "rgb(var(--surface-1))",
        borderRadius: 10,
        border: "1px solid rgb(var(--surface-2))",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 18px",
          borderBottom: "1px solid rgb(var(--surface-2))",
          display: "flex",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700 }}>Weekly log</div>
        <div style={{ fontSize: 11, color: "rgb(var(--fg-3))" }}>
          Notas de cada semana del ciclo
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: 10.5,
            color: "rgb(var(--fg-4))",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {WEEKLY_LOG.length} semanas
        </div>
      </div>
      {WEEKLY_LOG.map((w, i) => {
        const isOpen = expanded === i;
        const isCurrent = i === 0;
        return (
          <div
            key={w.week}
            style={{
              borderBottom:
                i === WEEKLY_LOG.length - 1
                  ? "none"
                  : "1px solid rgb(var(--surface-2) / 0.6)",
            }}
          >
            <button
              onClick={() => setExpanded(isOpen ? -1 : i)}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                padding: "11px 18px",
                display: "grid",
                gridTemplateColumns: "auto auto 1fr auto",
                gap: 14,
                alignItems: "center",
                cursor: "pointer",
                color: "inherit",
                fontFamily: "inherit",
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: isCurrent ? "rgb(var(--primary))" : "rgb(var(--fg-4))",
                  boxShadow: isCurrent ? "0 0 0 3px rgb(var(--primary) / 0.2)" : "none",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: isCurrent ? "rgb(var(--primary))" : "rgb(var(--fg))",
                  minWidth: 70,
                }}
              >
                {w.week}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "rgb(var(--fg-3))",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {w.dates} ·{" "}
                <span style={{ color: "rgb(var(--fg-4))" }}>
                  {w.items.length} update{w.items.length === 1 ? "" : "s"}
                </span>
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: "rgb(var(--fg-3))",
                  transform: isOpen ? "rotate(90deg)" : "rotate(0)",
                  transition: "transform 0.15s",
                  width: 14,
                  textAlign: "center",
                }}
              >
                ›
              </span>
            </button>
            {isOpen && (
              <ul
                style={{
                  listStyle: "none",
                  padding: "4px 18px 14px 52px",
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {w.items.map((it, j) => (
                  <li
                    key={j}
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      fontSize: 11.5,
                      color: "rgb(var(--fg-2))",
                      lineHeight: 1.5,
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
            )}
          </div>
        );
      })}
    </div>
  );
}

function ProjectDetail({ bet, onClose }: { bet: Bet; onClose: () => void }) {
  const c = objColor(bet.objectiveNum);
  const t = statusToken(bet.status, bet.dropped);
  const pct = Math.round((bet.progress || 0) * 100);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updates: { week: string; dates: string; text: string }[] = [];
  WEEKLY_LOG.forEach((w) => {
    w.items.forEach((item) => {
      const n = bet.name.toLowerCase();
      const firstWord = n.split(" ")[0];
      const lc = item.toLowerCase();
      if (
        lc.includes(n) ||
        (firstWord.length > 4 && lc.includes(firstWord)) ||
        (bet.name === "Retiros fondos MM" && (lc.includes("retiros mm") || lc.includes("retiros fondos mm"))) ||
        (bet.name === "Mejoras transf. Perú" && lc.includes("transf.")) ||
        (bet.name.startsWith("Fix 5.0 Perú") && lc.includes("fix 5.0")) ||
        (bet.name === "TC en depósitos" && lc.includes("tc") && lc.includes("depósito"))
      ) {
        updates.push({ week: w.week, dates: w.dates, text: item });
      }
    });
  });
  const hasHistory = updates.length > 0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        display: "flex",
        justifyContent: "flex-end",
        animation: "ct-fade-in 0.15s ease",
      }}
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgb(0 0 0 / 0.5)",
        }}
      />
      <div
        style={{
          position: "relative",
          width: 480,
          maxWidth: "100%",
          background: "rgb(var(--bg))",
          borderLeft: "1px solid rgb(var(--surface-2))",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-20px 0 40px rgb(0 0 0 / 0.3)",
          animation: "ct-slide-in 0.2s ease",
          overflowY: "auto",
        }}
      >
        <div
          style={{
            padding: "20px 22px 16px",
            borderBottom: "1px solid rgb(var(--surface-2))",
            borderTop: `3px solid ${c}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <ObjChip num={bet.objectiveNum} />
            <button
              onClick={onClose}
              style={{
                width: 24,
                height: 24,
                borderRadius: 5,
                border: "none",
                background: "rgb(var(--surface-1))",
                color: "rgb(var(--fg-3))",
                fontSize: 14,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
              }}
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: "-0.015em",
              lineHeight: 1.2,
              color: bet.dropped ? "rgb(var(--fg-3))" : "rgb(var(--fg))",
              textDecoration: bet.dropped ? "line-through" : "none",
            }}
          >
            {bet.name}
          </div>
          <div style={{ fontSize: 11.5, color: "rgb(var(--fg-3))", marginTop: 4 }}>
            {bet.objective}
          </div>
        </div>

        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgb(var(--surface-2))",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={labelStyle}>Estado</div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "4px 8px",
                  borderRadius: 4,
                  background: t.bg,
                  color: t.fg,
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                <StatusDot status={bet.status} dropped={bet.dropped} size={7} />
                {bet.dropped ? "Descartado" : bet.status}
              </div>
            </div>
            <div>
              <div style={labelStyle}>Avance</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 3,
                    background: "rgb(var(--surface-2))",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: bet.dropped ? "rgb(var(--fg-4))" : c,
                    }}
                  />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                    minWidth: 32,
                    textAlign: "right",
                    color: bet.dropped ? "rgb(var(--fg-4))" : "rgb(var(--fg))",
                  }}
                >
                  {pct}%
                </div>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Calendario</div>
              <div style={{ fontSize: 12, color: "rgb(var(--fg))", fontWeight: 500 }}>
                S{bet.weeks[0]} → S{bet.weeks[1]}
                <span style={{ color: "rgb(var(--fg-4))", fontWeight: 400 }}>
                  {" "}
                  · {bet.weeks[1] - bet.weeks[0] + 1} sem
                </span>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Equipo</div>
              <TeamStack team={bet.team} />
            </div>
          </div>
        </div>

        <div
          style={{
            padding: "16px 22px",
            borderBottom: "1px solid rgb(var(--surface-2))",
          }}
        >
          <div style={{ ...labelStyle, marginBottom: 7 }}>Último update</div>
          <div
            style={{
              fontSize: 12.5,
              color: "rgb(var(--fg-2))",
              lineHeight: 1.5,
              textWrap: "pretty" as React.CSSProperties["textWrap"],
            }}
          >
            {bet.lastUpdate}
          </div>
        </div>

        <div style={{ padding: "16px 22px 24px", flex: 1 }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <div style={labelStyle}>Historial</div>
            <div style={{ fontSize: 10, color: "rgb(var(--fg-4))" }}>
              {updates.length} entrada{updates.length === 1 ? "" : "s"} en weekly log
            </div>
          </div>
          {hasHistory ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                position: "relative",
                paddingLeft: 2,
              }}
            >
              {updates.map((u, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    paddingLeft: 22,
                    paddingBottom: i === updates.length - 1 ? 0 : 14,
                  }}
                >
                  {i !== updates.length - 1 && (
                    <div
                      style={{
                        position: "absolute",
                        left: 4,
                        top: 14,
                        bottom: 0,
                        width: 1,
                        background: "rgb(var(--surface-2))",
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 5,
                      width: 9,
                      height: 9,
                      borderRadius: "50%",
                      background: i === 0 ? c : "rgb(var(--surface-2))",
                      border: `2px solid rgb(var(--bg))`,
                      boxShadow: i === 0 ? `0 0 0 2px ${c}` : "none",
                    }}
                  />
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 3,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--fg))" }}>
                      {u.week}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgb(var(--fg-4))",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {u.dates}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "rgb(var(--fg-2))",
                      lineHeight: 1.5,
                      textWrap: "pretty" as React.CSSProperties["textWrap"],
                    }}
                  >
                    {u.text}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "14px 16px",
                background: "rgb(var(--surface-1))",
                border: "1px dashed rgb(var(--surface-2))",
                borderRadius: 6,
                fontSize: 11.5,
                color: "rgb(var(--fg-3))",
                lineHeight: 1.5,
                textAlign: "center",
              }}
            >
              Sin entradas históricas en weekly log.
              <br />
              <span style={{ color: "rgb(var(--fg-4))", fontSize: 10.5 }}>
                Ver &quot;Último update&quot; arriba.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  fontSize: 9.5,
  fontWeight: 700,
  letterSpacing: "0.08em",
  color: "rgb(var(--fg-4))",
  textTransform: "uppercase",
  marginBottom: 5,
};

export default function EstadoDelCiclo() {
  const [selected, setSelected] = useState<Bet | null>(null);

  return (
    <>
      <KPIStrip />
      <div
        style={{
          padding: "16px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
        }}
      >
        <Gantt onSelect={setSelected} />
        <WeeklyLog />
        {selected && <ProjectDetail bet={selected} onClose={() => setSelected(null)} />}
      </div>
    </>
  );
}
