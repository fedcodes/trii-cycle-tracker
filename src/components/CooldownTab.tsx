"use client";

import {
  COOLDOWN,
  COOLDOWN_DEVS,
  COOLDOWN_KINDS,
  CooldownDev,
  CooldownTask,
  devTasks,
  getCooldownKPIs,
  getCurrentCooldownDay,
  kindToken,
} from "@/data/cycle";

const CD_DAYS = 10;
const DAY_LABELS = ["L", "M", "M", "J", "V", "L", "M", "M", "J", "V"];
const DATE_LABELS = [
  "Abr 27", "Abr 28", "Abr 29", "Abr 30", "May 1",
  "May 4", "May 5", "May 6", "May 7", "May 8",
];

type Placed = { task: CooldownTask; start: number; end: number };

function layoutTasks(tasks: CooldownTask[], currentDay: number | null): Placed[] {
  const widthFor = (t: CooldownTask): number => {
    if (t.effort) {
      const m = /^(\d+)d$/.exec(t.effort);
      if (m) return Math.min(CD_DAYS, parseInt(m[1], 10));
    }
    return t.kind === "carryover" ? 4 : t.kind === "debt" ? 3 : 1;
  };

  const order: Record<CooldownTask["status"], number> = { done: 0, doing: 1, todo: 2 };
  const sorted = [...tasks].sort((a, b) => order[a.status] - order[b.status]);
  const anchor = currentDay ?? 0;
  let cursor = 0;
  const placed: Placed[] = [];
  for (const t of sorted) {
    if (t.startDay !== undefined && t.endDay !== undefined) {
      const start = Math.max(0, Math.min(CD_DAYS - 1, t.startDay));
      const end = Math.max(start + 1, Math.min(CD_DAYS, t.endDay + 1));
      placed.push({ task: t, start, end });
      cursor = end;
      continue;
    }
    const w = widthFor(t);
    let start = cursor;
    if (t.status === "done") start = Math.max(0, Math.min(cursor, anchor - w));
    if (t.status === "doing") start = Math.max(0, Math.min(anchor - 1, CD_DAYS - w));
    if (t.status === "todo") start = Math.max(anchor, cursor);
    const end = Math.min(CD_DAYS, start + w);
    placed.push({ task: t, start, end });
    cursor = end;
  }
  return placed;
}

function DayGrid({ currentDay }: { currentDay: number | null }) {
  return (
    <>
      {Array.from({ length: CD_DAYS - 1 }).map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${((i + 1) / CD_DAYS) * 100}%`,
            top: 0,
            bottom: 0,
            width: 1,
            background:
              i === 4
                ? "rgb(var(--surface-2))"
                : "rgb(var(--surface-2) / 0.5)",
          }}
        />
      ))}
      {currentDay !== null && (
        <div
          style={{
            position: "absolute",
            left: `${(currentDay / CD_DAYS) * 100}%`,
            top: 0,
            bottom: 0,
            width: 2,
            background: "rgb(var(--yellow))",
            boxShadow: "0 0 12px rgb(var(--yellow) / 0.45)",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}

function DevTimelineRow({
  dev,
  currentDay,
  isLast,
}: {
  dev: CooldownDev;
  currentDay: number | null;
  isLast: boolean;
}) {
  const tasks = devTasks(dev.code);
  const placed = layoutTasks(tasks, currentDay);
  const barHeight = 22;
  const rowGap = 5;
  const topPad = 12;
  const rowH =
    Math.max(1, placed.length) * (barHeight + rowGap) - rowGap + topPad * 2;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        borderBottom: isLast ? "none" : "1px solid rgb(var(--surface-2) / 0.6)",
      }}
    >
      <div
        style={{
          padding: "14px 20px",
          borderRight: "1px solid rgb(var(--surface-2) / 0.6)",
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: "rgb(var(--surface-2))",
            color: "rgb(var(--fg))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            fontVariantNumeric: "tabular-nums",
            flexShrink: 0,
          }}
        >
          {dev.code}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "rgb(var(--fg))",
              letterSpacing: "-0.01em",
            }}
          >
            {dev.name}
          </div>
          <div style={{ fontSize: 10, color: "rgb(var(--fg-3))", marginTop: 1 }}>
            {dev.role} · {tasks.length} {tasks.length === 1 ? "tarea" : "tareas"}
          </div>
        </div>
      </div>

      <div
        style={{
          position: "relative",
          height: rowH,
          background: "rgb(var(--surface-0) / 0.4)",
        }}
      >
        <DayGrid currentDay={currentDay} />
        {placed.map(({ task, start, end }, i) => {
          const k = kindToken(task.kind);
          const kColor = `rgb(var(--${k.colorVar}))`;
          const kDim = `rgb(var(--${k.dimVar}))`;
          const left = (start / CD_DAYS) * 100;
          const width = ((end - start) / CD_DAYS) * 100;
          const done = task.status === "done";
          const doing = task.status === "doing";

          let bg: string, border: string, textColor: string;
          if (done) {
            bg = kColor;
            border = kColor;
            textColor = "rgb(var(--bg))";
          } else if (doing) {
            bg = kDim;
            border = kColor;
            textColor = "rgb(var(--fg))";
          } else {
            bg = "rgb(var(--surface-2))";
            border = "rgb(var(--fg-4))";
            textColor = "rgb(var(--fg-2))";
          }

          return (
            <div
              key={task.id}
              style={{
                position: "absolute",
                left: `calc(${left}% + 6px)`,
                width: `calc(${width}% - 12px)`,
                top: topPad + i * (barHeight + rowGap),
                height: barHeight,
                background: bg,
                border: `1px solid ${border}`,
                borderStyle: task.status === "todo" ? "dashed" : "solid",
                borderRadius: 4,
                padding: "0 8px",
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 10.5,
                fontWeight: 600,
                color: textColor,
                letterSpacing: "-0.003em",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: done ? "rgb(var(--bg))" : kColor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textDecoration: done ? "line-through" : "none",
                }}
              >
                {task.title}
              </span>
            </div>
          );
        })}
        {placed.length === 0 && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              color: "rgb(var(--fg-4))",
              fontStyle: "italic",
            }}
          >
            Sin tareas
          </div>
        )}
      </div>
    </div>
  );
}

export default function CooldownTab() {
  const k = getCooldownKPIs();
  const currentDay = getCurrentCooldownDay(COOLDOWN.startDate, COOLDOWN.endDate);
  const pct = k.total > 0 ? Math.round((k.done / k.total) * 100) : 0;
  const daysLeft =
    currentDay === null ? COOLDOWN.totalDays : COOLDOWN.totalDays - currentDay;
  const todayLabel =
    currentDay !== null
      ? DATE_LABELS[currentDay]
      : `arranca ${DATE_LABELS[0]}`;

  const kpis = [
    {
      label: "Días restantes",
      value: daysLeft,
      sub: `de ${COOLDOWN.totalDays} · hasta ${COOLDOWN.nextCycleStart}`,
      accent: "rgb(var(--fg))",
    },
    {
      label: "En curso",
      value: k.doing,
      sub: "Ahora mismo",
      accent: "rgb(var(--yellow))",
    },
    {
      label: "Listas",
      value: k.done,
      sub: `${pct}% del cooldown`,
      accent: "rgb(var(--primary))",
    },
    {
      label: "Pendientes",
      value: k.todo,
      sub: "Sin arrancar",
      accent: "rgb(var(--fg-2))",
    },
    {
      label: "Devs activos",
      value: COOLDOWN_DEVS.length,
      sub: `${k.total} tareas tomadas`,
      accent: "rgb(var(--fg))",
    },
  ];

  return (
    <>
      <div
        style={{
          padding: "18px 28px 16px",
          borderBottom: "1px solid rgb(var(--surface-2))",
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            color: "rgb(var(--yellow))",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Cooldown
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: "rgb(var(--fg))",
            letterSpacing: "-0.015em",
            marginTop: 4,
          }}
        >
          {COOLDOWN.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "rgb(var(--fg-3))",
            marginTop: 4,
            lineHeight: 1.5,
            maxWidth: 720,
          }}
        >
          Vista temporal: cada dev es una fila, cada barra es una tarea. Carryover, tech debt y bugs comparten el mismo calendario — la línea amarilla marca hoy.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          borderBottom: "1px solid rgb(var(--surface-2))",
        }}
      >
        {kpis.map((it, i) => (
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
            <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
              {it.sub}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: "20px 28px 32px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgb(var(--fg))" }}>
              Calendario del equipo
            </div>
            <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
              2 semanas · {COOLDOWN_DEVS.length} devs · {currentDay !== null ? `hoy es ${todayLabel}` : todayLabel}
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {COOLDOWN_KINDS.map((kk) => (
              <span
                key={kk.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 10.5,
                  color: "rgb(var(--fg-2))",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 9,
                    borderRadius: 2,
                    background: `rgb(var(--${kk.colorVar}))`,
                  }}
                />
                {kk.label}
              </span>
            ))}
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
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              borderBottom: "1px solid rgb(var(--surface-2))",
              background: "rgb(var(--surface-0) / 0.3)",
            }}
          >
            <div
              style={{
                padding: "10px 20px",
                borderRight: "1px solid rgb(var(--surface-2))",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "rgb(var(--fg-4))",
                display: "flex",
                alignItems: "center",
              }}
            >
              Dev / equipo
            </div>
            <div
              style={{
                position: "relative",
                height: 44,
                display: "grid",
                gridTemplateColumns: `repeat(${CD_DAYS}, 1fr)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  bottom: 0,
                  left: 0,
                  width: "50%",
                  background: "rgb(var(--surface-0) / 0.25)",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: "25%",
                  transform: "translateX(-50%)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgb(var(--fg-4))",
                }}
              >
                Semana 1 · Abr 27 – May 1
              </div>
              <div
                style={{
                  position: "absolute",
                  top: 4,
                  left: "75%",
                  transform: "translateX(-50%)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "rgb(var(--fg-4))",
                }}
              >
                Semana 2 · May 4 – May 8
              </div>
              {DAY_LABELS.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    paddingBottom: 6,
                    background:
                      i === currentDay ? "rgb(var(--yellow) / 0.08)" : "transparent",
                    borderLeft: i === 5 ? "1px solid rgb(var(--surface-2))" : "none",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color:
                        i === currentDay ? "rgb(var(--yellow))" : "rgb(var(--fg-3))",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {d}
                  </div>
                  <div
                    style={{
                      fontSize: 9,
                      color: "rgb(var(--fg-4))",
                      fontVariantNumeric: "tabular-nums",
                      marginTop: 1,
                    }}
                  >
                    {DATE_LABELS[i].replace(/^\w+\s/, "")}
                  </div>
                </div>
              ))}
              <DayGrid currentDay={currentDay} />
            </div>
          </div>

          {COOLDOWN_DEVS.map((dev, i) => (
            <DevTimelineRow
              key={dev.code}
              dev={dev}
              currentDay={currentDay}
              isLast={i === COOLDOWN_DEVS.length - 1}
            />
          ))}
        </div>
      </div>
    </>
  );
}
