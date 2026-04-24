"use client";

import {
  DISCOVERY,
  DISCOVERY_STAGES,
  CYCLE,
  objColor,
  DiscoveryObjective,
  DiscoveryTask,
  DiscoveryStage,
} from "@/data/cycle";

const STAGE_TONES: Record<string, string> = {
  backlog: "rgb(var(--fg-3))",
  research: "rgb(var(--blue))",
  design: "rgb(var(--yellow))",
  ready: "rgb(var(--primary))",
};

const PRIORITY: Record<string, { c: string; label: string }> = {
  high: { c: "rgb(var(--red))", label: "Alta" },
  med: { c: "rgb(var(--yellow))", label: "Media" },
  low: { c: "rgb(var(--fg-4))", label: "Baja" },
};

function FigmaIcon({ size = 11 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M8 24a4 4 0 0 0 4-4v-4H8a4 4 0 0 0 0 8z" fill="#0ACF83" />
      <path d="M4 12a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" fill="#A259FF" />
      <path d="M4 4a4 4 0 0 1 4-4h4v8H8a4 4 0 0 1-4-4z" fill="#F24E1E" />
      <path d="M12 0h4a4 4 0 0 1 0 8h-4V0z" fill="#FF7262" />
      <path d="M20 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0z" fill="#1ABCFE" />
    </svg>
  );
}

function Avatar({ name, label }: { name: string | null; label: string }) {
  if (!name) {
    return (
      <div
        title={`${label} — sin asignar`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          fontSize: 10,
          color: "rgb(var(--fg-4))",
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "transparent",
            border: "1px dashed rgb(var(--surface-2))",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            color: "rgb(var(--fg-4))",
          }}
        >
          ?
        </span>
        <span style={{ fontSize: 9.5 }}>{label}</span>
      </div>
    );
  }
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      title={`${label}: ${name}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontSize: 10,
        color: "rgb(var(--fg-2))",
      }}
    >
      <span
        style={{
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "rgb(var(--surface-2))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 9,
          fontWeight: 700,
          color: "rgb(var(--fg))",
        }}
      >
        {initials}
      </span>
      <span style={{ fontSize: 10 }}>{name.split(" ")[0]}</span>
    </div>
  );
}

function TaskCard({
  task,
  objId,
  objName,
}: {
  task: DiscoveryTask;
  objId: number;
  objName: string;
}) {
  const c = objColor(objId);
  const pri = PRIORITY[task.priority] || PRIORITY.med;
  const hasFigma = !!task.figma;

  return (
    <div
      style={{
        background: "rgb(var(--surface-1))",
        border: "1px solid rgb(var(--surface-2))",
        borderLeft: `3px solid ${c}`,
        borderRadius: 6,
        padding: "10px 12px 10px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 7,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: c,
            textTransform: "uppercase",
          }}
        >
          OBJ. {objId}
        </span>
        <span
          style={{
            fontSize: 9.5,
            color: "rgb(var(--fg-4))",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            flex: 1,
          }}
        >
          {objName}
        </span>
        <span
          title={`Prioridad ${pri.label}`}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: pri.c,
            flexShrink: 0,
          }}
        />
      </div>

      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "rgb(var(--fg))",
          lineHeight: 1.35,
          letterSpacing: "-0.003em",
        }}
      >
        {task.name}
      </div>

      {task.notes && (
        <div style={{ fontSize: 10.5, color: "rgb(var(--fg-3))", lineHeight: 1.4 }}>
          {task.notes}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
        <div
          style={{
            display: "flex",
            gap: 6,
            alignItems: "center",
            flex: 1,
            minWidth: 0,
          }}
        >
          <Avatar name={task.owner} label="PO" />
          <Avatar name={task.designer} label="Des" />
        </div>
        <a
          href={task.figma || undefined}
          target={hasFigma ? "_blank" : undefined}
          rel="noreferrer"
          onClick={(e) => !hasFigma && e.preventDefault()}
          title={hasFigma ? "Abrir en Figma" : "Sin archivo de Figma"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            padding: "4px 8px",
            fontSize: 10,
            fontWeight: 600,
            background: hasFigma ? "rgb(var(--surface-2))" : "transparent",
            color: hasFigma ? "rgb(var(--fg-2))" : "rgb(var(--fg-4))",
            borderRadius: 4,
            border: hasFigma ? "none" : "1px dashed rgb(var(--surface-2))",
            textDecoration: "none",
            cursor: hasFigma ? "pointer" : "not-allowed",
            flexShrink: 0,
          }}
        >
          {hasFigma ? (
            <FigmaIcon />
          ) : (
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                border: "1px dashed rgb(var(--fg-4))",
                display: "inline-block",
              }}
            />
          )}
          Figma
        </a>
      </div>
    </div>
  );
}

function DiscoverySummary() {
  const all = DISCOVERY.flatMap((o) => o.tasks);
  const byStage: Record<string, number> = {};
  DISCOVERY_STAGES.forEach((s) => (byStage[s.id] = 0));
  all.forEach((t) => (byStage[t.stage] = (byStage[t.stage] || 0) + 1));
  const total = all.length;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto repeat(4, 1fr)",
        borderBottom: "1px solid rgb(var(--surface-2))",
      }}
    >
      <div style={{ padding: "14px 20px" }}>
        <div
          style={{
            fontSize: 10.5,
            color: "rgb(var(--fg-3))",
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Items en discovery
        </div>
        <div
          style={{
            fontSize: 26,
            fontWeight: 700,
            marginTop: 4,
            color: "rgb(var(--fg))",
            letterSpacing: "-0.02em",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {total}
        </div>
      </div>
      {DISCOVERY_STAGES.map((s) => {
        const tone = STAGE_TONES[s.id];
        return (
          <div
            key={s.id}
            style={{
              padding: "14px 20px",
              borderLeft: "1px solid rgb(var(--surface-2))",
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                color: "rgb(var(--fg-3))",
                fontWeight: 500,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: tone,
                }}
              />
              {s.label}
            </div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 700,
                marginTop: 4,
                color: "rgb(var(--fg))",
                letterSpacing: "-0.02em",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {byStage[s.id] || 0}
            </div>
            <div style={{ fontSize: 10, color: "rgb(var(--fg-4))", marginTop: 2 }}>
              {s.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ObjectiveOverview({ obj }: { obj: DiscoveryObjective }) {
  const c = objColor(obj.id);
  const taskCount = obj.tasks.length;

  return (
    <div
      style={{
        background: "rgb(var(--surface-1))",
        border: "1px solid rgb(var(--surface-2))",
        borderTop: `3px solid ${c}`,
        borderRadius: 8,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        minHeight: 220,
      }}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: c,
            textTransform: "uppercase",
          }}
        >
          Obj. {obj.id}
        </span>
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "rgb(var(--fg))",
            letterSpacing: "-0.005em",
            lineHeight: 1.25,
          }}
        >
          {obj.shortName}
        </span>
      </div>

      <div
        style={{
          fontSize: 11,
          color: "rgb(var(--fg-2))",
          lineHeight: 1.5,
          textWrap: "pretty" as React.CSSProperties["textWrap"],
        }}
      >
        {obj.description}
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
          padding: "8px 10px",
          background: "rgb(var(--bg))",
          borderRadius: 5,
        }}
      >
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.08em",
            color: "rgb(var(--fg-4))",
            textTransform: "uppercase",
          }}
        >
          Métrica
        </div>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 600,
            color: "rgb(var(--fg))",
            letterSpacing: "-0.003em",
          }}
        >
          {obj.metric}
        </div>
        <div style={{ fontSize: 10, color: "rgb(var(--fg-3))" }}>
          Target: {obj.target}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 10.5,
          color: "rgb(var(--fg-3))",
          paddingTop: 8,
          borderTop: "1px solid rgb(var(--surface-2))",
        }}
      >
        <span>
          PO{" "}
          <span
            style={{
              color: obj.po ? "rgb(var(--fg-2))" : "rgb(var(--red))",
              fontWeight: 600,
            }}
          >
            {obj.po || "sin asignar"}
          </span>
        </span>
        <span style={{ color: "rgb(var(--fg-4))" }}>·</span>
        <span>
          Design{" "}
          <span
            style={{
              color: obj.designer ? "rgb(var(--fg-2))" : "rgb(var(--red))",
              fontWeight: 600,
            }}
          >
            {obj.designer || "sin asignar"}
          </span>
        </span>
        <span
          style={{
            marginLeft: "auto",
            color: "rgb(var(--fg-4))",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {taskCount} task{taskCount === 1 ? "" : "s"}
        </span>
      </div>

      {obj.context && (
        <div
          style={{
            fontSize: 10,
            color: "rgb(var(--yellow))",
            background: "rgb(var(--yellow-dim))",
            padding: "6px 8px",
            borderRadius: 3,
            lineHeight: 1.4,
            display: "flex",
            gap: 6,
            alignItems: "flex-start",
          }}
        >
          <span style={{ flexShrink: 0, marginTop: 1 }}>⚠</span>
          <span>{obj.context}</span>
        </div>
      )}
    </div>
  );
}

function ObjectivesOverview() {
  return (
    <div style={{ padding: "18px 28px 0" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Objetivos del ciclo</div>
        <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
          Los 5 objetivos que enmarcan todo el discovery abajo
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 10,
        }}
      >
        {DISCOVERY.map((o) => (
          <ObjectiveOverview key={o.id} obj={o} />
        ))}
      </div>
    </div>
  );
}

interface KanbanTask extends DiscoveryTask {
  objId: number;
  objShort: string;
}

function KanbanColumn({ stage, tasks }: { stage: DiscoveryStage; tasks: KanbanTask[] }) {
  const tone = STAGE_TONES[stage.id];
  return (
    <div
      style={{
        background: "rgb(var(--surface-0))",
        borderRadius: 8,
        border: "1px solid rgb(var(--surface-2))",
        display: "flex",
        flexDirection: "column",
        minHeight: 400,
      }}
    >
      <div
        style={{
          padding: "11px 14px",
          borderBottom: "1px solid rgb(var(--surface-2))",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: tone,
          }}
        />
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            letterSpacing: "-0.005em",
            color: "rgb(var(--fg))",
          }}
        >
          {stage.label}
        </span>
        <span
          style={{
            fontSize: 10.5,
            color: "rgb(var(--fg-4))",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {tasks.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            border: "none",
            background: "transparent",
            color: "rgb(var(--fg-4))",
            fontSize: 14,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Agregar"
        >
          +
        </button>
      </div>
      <div
        style={{
          padding: 10,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        {tasks.length === 0 ? (
          <div
            style={{
              fontSize: 10.5,
              color: "rgb(var(--fg-4))",
              fontStyle: "italic",
              padding: "20px 6px",
              textAlign: "center",
            }}
          >
            Sin items
          </div>
        ) : (
          tasks.map((t, i) => (
            <TaskCard
              key={`${t.name}-${i}`}
              task={t}
              objId={t.objId}
              objName={t.objShort}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DiscoveryKanban() {
  const all: KanbanTask[] = [];
  DISCOVERY.forEach((obj) => {
    const short = obj.name.replace(/^Obj\. \d+ — /, "").split(" ").slice(0, 3).join(" ");
    obj.tasks.forEach((t) =>
      all.push({ ...t, objId: obj.id, objShort: short })
    );
  });

  const pOrder: Record<string, number> = { high: 0, med: 1, low: 2 };
  const byStage: Record<string, KanbanTask[]> = {};
  DISCOVERY_STAGES.forEach((s) => (byStage[s.id] = []));
  all.forEach((t) => byStage[t.stage].push(t));
  Object.values(byStage).forEach((arr) =>
    arr.sort((a, b) => pOrder[a.priority] - pOrder[b.priority])
  );

  return (
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
          <div style={{ fontSize: 13, fontWeight: 700 }}>Tablero de discovery</div>
          <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
            Kanban por etapa · ordenado por prioridad · {CYCLE.lastUpdated}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <LegendDot c="rgb(var(--obj-1))" label="Pro" />
          <LegendDot c="rgb(var(--obj-2))" label="US Stocks" />
          <LegendDot c="rgb(var(--obj-3))" label="Chile" />
          <LegendDot c="rgb(var(--obj-4))" label="Activación" />
          <LegendDot c="rgb(var(--obj-5))" label="Fondos PE" />
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {DISCOVERY_STAGES.map((s) => (
          <KanbanColumn key={s.id} stage={s} tasks={byStage[s.id]} />
        ))}
      </div>
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

export default function DiscoveryTab() {
  return (
    <>
      <DiscoverySummary />
      <ObjectivesOverview />
      <DiscoveryKanban />
    </>
  );
}
