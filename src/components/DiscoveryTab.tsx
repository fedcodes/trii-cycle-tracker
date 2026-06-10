"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type {
  CycleRow,
  DiscoveryObjectiveRow,
  DiscoveryPriority,
  DiscoveryStage,
  DiscoveryStageId,
  DiscoveryTaskRow,
} from "@/lib/types";
import {
  DISCOVERY_STAGES,
  PRIORITY_TONES,
  STAGE_TONES,
  objColor,
} from "@/lib/cycle-utils";
import {
  deleteDiscoveryTask,
  fetchDiscovery,
  insertDiscoveryTask,
  updateDiscoveryObjective,
  updateDiscoveryTask,
} from "@/lib/db";
import {
  DangerConfirmButton,
  ErrorBanner,
  Field,
  GhostButton,
  LegendDot,
  LoadingState,
  Modal,
  PrimaryButton,
  Select,
  TextArea,
  TextInput,
} from "./ui";

const PRIORITIES: DiscoveryPriority[] = ["high", "med", "low"];

type TaskFormTarget = { task: DiscoveryTaskRow | null; stage: DiscoveryStageId };

export default function DiscoveryTab({ cycle }: { cycle: CycleRow }) {
  const [objectives, setObjectives] = useState<DiscoveryObjectiveRow[]>([]);
  const [tasks, setTasks] = useState<DiscoveryTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<TaskFormTarget | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchDiscovery(cycle.id);
        if (cancelled) return;
        setObjectives(data.objectives);
        setTasks(data.tasks);
        setError(null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cycle.id]);

  const patchTask = useCallback(async (id: string, patch: Partial<DiscoveryTaskRow>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    const err = await updateDiscoveryTask(id, patch);
    if (err) setError(err);
  }, []);

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const err = await deleteDiscoveryTask(id);
    if (err) setError(err);
  }, []);

  const createTask = useCallback(
    async (draft: TaskDraft) => {
      const position = tasks.length ? Math.max(...tasks.map((t) => t.position)) + 1 : 0;
      const { data, error: err } = await insertDiscoveryTask({ ...draft, position });
      if (err || !data) {
        setError(err ?? "No se pudo crear el item");
        return false;
      }
      setTasks((prev) => [...prev, data]);
      return true;
    },
    [tasks]
  );

  const patchObjective = useCallback(
    async (id: string, patch: Partial<DiscoveryObjectiveRow>) => {
      setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
      const err = await updateDiscoveryObjective(id, patch);
      if (err) setError(err);
    },
    []
  );

  const objById = useMemo(
    () => new Map(objectives.map((o) => [o.id, o])),
    [objectives]
  );

  // Para los datalists de responsables: nombres ya usados en el ciclo.
  const knownPeople = useMemo(() => {
    const s = new Set<string>();
    tasks.forEach((t) => {
      if (t.owner) s.add(t.owner);
      if (t.designer) s.add(t.designer);
    });
    objectives.forEach((o) => {
      if (o.po) s.add(o.po);
      if (o.designer) s.add(o.designer);
    });
    return [...s].sort();
  }, [tasks, objectives]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const stage = over.id as DiscoveryStageId;
    const task = tasks.find((t) => t.id === active.id);
    if (task && task.stage !== stage) patchTask(task.id, { stage });
  };

  if (loading) return <LoadingState label="Cargando discovery…" />;

  return (
    <>
      {error && <ErrorBanner message={`Error: ${error}`} />}
      <DiscoverySummary tasks={tasks} />
      <ObjectivesOverview objectives={objectives} tasks={tasks} onPatch={patchObjective} />

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
              Arrastra las cards entre etapas · click para editar · ordenado por prioridad
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
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 12,
              alignItems: "stretch",
            }}
          >
            {DISCOVERY_STAGES.map((s) => (
              <KanbanColumn
                key={s.id}
                stage={s}
                tasks={tasks
                  .filter((t) => t.stage === s.id)
                  .sort(
                    (a, b) =>
                      PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority) ||
                      a.position - b.position
                  )}
                objById={objById}
                onAdd={() => setFormTarget({ task: null, stage: s.id })}
                onOpen={(t) => setFormTarget({ task: t, stage: t.stage })}
              />
            ))}
          </div>
        </DndContext>
      </div>

      {formTarget && (
        <TaskFormModal
          target={formTarget}
          objectives={objectives}
          knownPeople={knownPeople}
          onClose={() => setFormTarget(null)}
          onCreate={createTask}
          onPatch={patchTask}
          onDelete={removeTask}
        />
      )}
    </>
  );
}

// ── Summary strip ──────────────────────────────────────────

function DiscoverySummary({ tasks }: { tasks: DiscoveryTaskRow[] }) {
  const byStage: Record<string, number> = {};
  DISCOVERY_STAGES.forEach((s) => (byStage[s.id] = 0));
  tasks.forEach((t) => (byStage[t.stage] = (byStage[t.stage] || 0) + 1));

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
          {tasks.length}
        </div>
      </div>
      {DISCOVERY_STAGES.map((s) => {
        const tone = STAGE_TONES[s.id];
        return (
          <div
            key={s.id}
            style={{ padding: "14px 20px", borderLeft: "1px solid rgb(var(--surface-2))" }}
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
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: tone }} />
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
            <div style={{ fontSize: 10, color: "rgb(var(--fg-4))", marginTop: 2 }}>{s.desc}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Objectives overview (PO / Design editable) ─────────────

function InlinePerson({
  value,
  placeholder,
  onCommit,
}: {
  value: string | null;
  placeholder: string;
  onCommit: (v: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value ?? "");

  if (!editing) {
    return (
      <button
        onClick={() => {
          setLocal(value ?? "");
          setEditing(true);
        }}
        title="Click para editar"
        style={{
          background: "transparent",
          border: "none",
          padding: 0,
          fontFamily: "inherit",
          fontSize: "inherit",
          color: value ? "rgb(var(--fg-2))" : "rgb(var(--red))",
          fontWeight: 600,
          cursor: "pointer",
          borderBottom: "1px dashed rgb(var(--surface-2))",
        }}
      >
        {value || placeholder}
      </button>
    );
  }
  return (
    <input
      value={local}
      autoFocus
      onChange={(e) => setLocal(e.target.value)}
      onBlur={() => {
        setEditing(false);
        const v = local.trim();
        if (v !== (value ?? "")) onCommit(v || null);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") {
          setLocal(value ?? "");
          setEditing(false);
        }
      }}
      style={{
        background: "rgb(var(--surface-2))",
        border: "none",
        outline: "none",
        borderRadius: 3,
        padding: "1px 4px",
        fontFamily: "inherit",
        fontSize: "inherit",
        color: "rgb(var(--fg))",
        fontWeight: 600,
        width: 90,
      }}
    />
  );
}

function ObjectivesOverview({
  objectives,
  tasks,
  onPatch,
}: {
  objectives: DiscoveryObjectiveRow[];
  tasks: DiscoveryTaskRow[];
  onPatch: (id: string, patch: Partial<DiscoveryObjectiveRow>) => void;
}) {
  return (
    <div style={{ padding: "18px 28px 0" }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Objetivos del ciclo</div>
        <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
          Los objetivos y asks que enmarcan todo el discovery abajo · click en PO / Design para reasignar
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.max(objectives.length, 1)}, 1fr)`,
          gap: 10,
        }}
      >
        {objectives.map((o) => {
          const c = objColor(o.obj_num);
          const taskCount = tasks.filter((t) => t.objective_id === o.id).length;
          return (
            <div
              key={o.id}
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
                  {o.obj_num >= 90 ? "Asks" : `Obj. ${o.obj_num}`}
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
                  {o.short_name}
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
                {o.description}
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
                  {o.metric}
                </div>
                <div style={{ fontSize: 10, color: "rgb(var(--fg-3))" }}>Target: {o.target}</div>
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
                  flexWrap: "wrap",
                }}
              >
                <span>
                  PO{" "}
                  <InlinePerson
                    value={o.po}
                    placeholder="sin asignar"
                    onCommit={(v) => onPatch(o.id, { po: v })}
                  />
                </span>
                <span style={{ color: "rgb(var(--fg-4))" }}>·</span>
                <span>
                  Design{" "}
                  <InlinePerson
                    value={o.designer}
                    placeholder="sin asignar"
                    onCommit={(v) => onPatch(o.id, { designer: v })}
                  />
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

              {o.context && (
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
                  <span>{o.context}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Kanban ─────────────────────────────────────────────────

function KanbanColumn({
  stage,
  tasks,
  objById,
  onAdd,
  onOpen,
}: {
  stage: DiscoveryStage;
  tasks: DiscoveryTaskRow[];
  objById: Map<string, DiscoveryObjectiveRow>;
  onAdd: () => void;
  onOpen: (t: DiscoveryTaskRow) => void;
}) {
  const tone = STAGE_TONES[stage.id];
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        background: isOver ? "rgb(var(--surface-1))" : "rgb(var(--surface-0))",
        borderRadius: 8,
        border: isOver ? `1px solid ${tone}` : "1px solid rgb(var(--surface-2))",
        display: "flex",
        flexDirection: "column",
        minHeight: 400,
        transition: "background 0.12s ease, border-color 0.12s ease",
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
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: tone }} />
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
          onClick={onAdd}
          aria-label={`Agregar item en ${stage.label}`}
          title={`Agregar item en ${stage.label}`}
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
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgb(var(--surface-2))";
            e.currentTarget.style.color = "rgb(var(--fg))";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "rgb(var(--fg-4))";
          }}
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
            {isOver ? "Suelta aquí" : "Sin items"}
          </div>
        ) : (
          tasks.map((t) => (
            <DraggableTaskCard key={t.id} task={t} obj={objById.get(t.objective_id)} onOpen={onOpen} />
          ))
        )}
      </div>
    </div>
  );
}

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

function DraggableTaskCard({
  task,
  obj,
  onOpen,
}: {
  task: DiscoveryTaskRow;
  obj: DiscoveryObjectiveRow | undefined;
  onOpen: (t: DiscoveryTaskRow) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const objNum = obj?.obj_num ?? 99;
  const c = objColor(objNum);
  const pri = PRIORITY_TONES[task.priority] || PRIORITY_TONES.med;
  const figmaUrl = task.figma && task.figma !== "#" ? task.figma : null;
  const hasFigma = !!figmaUrl;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging) onOpen(task);
      }}
      style={{
        background: "rgb(var(--surface-1))",
        border: "1px solid rgb(var(--surface-2))",
        borderLeft: `3px solid ${c}`,
        borderRadius: 6,
        padding: "10px 12px 10px 13px",
        display: "flex",
        flexDirection: "column",
        gap: 7,
        cursor: isDragging ? "grabbing" : "grab",
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.85 : 1,
        zIndex: isDragging ? 20 : undefined,
        position: isDragging ? "relative" : undefined,
        boxShadow: isDragging ? "0 10px 28px rgba(0,0,0,0.45)" : undefined,
        touchAction: "none",
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
          {objNum >= 90 ? "Asks" : `OBJ. ${objNum}`}
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
          {obj?.short_name ?? ""}
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
        <div style={{ display: "flex", gap: 6, alignItems: "center", flex: 1, minWidth: 0 }}>
          <Avatar name={task.owner} label="PO" />
          <Avatar name={task.designer} label="Des" />
        </div>
        {hasFigma ? (
          <a
            href={figmaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            title="Abrir en Figma"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 600,
              background: "rgb(var(--surface-2))",
              color: "rgb(var(--fg-2))",
              borderRadius: 4,
              textDecoration: "none",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <FigmaIcon />
            Figma
          </a>
        ) : (
          <span
            title="Sin archivo de Figma"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 600,
              color: "rgb(var(--fg-4))",
              borderRadius: 4,
              border: "1px dashed rgb(var(--surface-2))",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: "50%",
                border: "1px dashed rgb(var(--fg-4))",
                display: "inline-block",
              }}
            />
            Figma
          </span>
        )}
      </div>
    </div>
  );
}

// ── Task form (create / edit) ──────────────────────────────

type TaskDraft = Omit<DiscoveryTaskRow, "id" | "created_at" | "updated_at" | "position">;

function TaskFormModal({
  target,
  objectives,
  knownPeople,
  onClose,
  onCreate,
  onPatch,
  onDelete,
}: {
  target: TaskFormTarget;
  objectives: DiscoveryObjectiveRow[];
  knownPeople: string[];
  onClose: () => void;
  onCreate: (draft: TaskDraft) => Promise<boolean>;
  onPatch: (id: string, patch: Partial<DiscoveryTaskRow>) => void;
  onDelete: (id: string) => void;
}) {
  const { task } = target;
  const [name, setName] = useState(task?.name ?? "");
  const [objectiveId, setObjectiveId] = useState(task?.objective_id ?? objectives[0]?.id ?? "");
  const [stage, setStage] = useState<DiscoveryStageId>(task?.stage ?? target.stage);
  const [owner, setOwner] = useState(task?.owner ?? "");
  const [designer, setDesigner] = useState(task?.designer ?? "");
  const [priority, setPriority] = useState<DiscoveryPriority>(task?.priority ?? "med");
  const [figma, setFigma] = useState(task?.figma ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const valid = name.trim().length > 0 && objectiveId;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const draft: TaskDraft = {
      objective_id: objectiveId,
      name: name.trim(),
      stage,
      owner: owner.trim() || null,
      designer: designer.trim() || null,
      priority,
      figma: figma.trim() || null,
      notes: notes.trim(),
    };
    if (task) {
      onPatch(task.id, draft);
      setSaving(false);
      onClose();
      return;
    }
    const ok = await onCreate(draft);
    setSaving(false);
    if (ok) onClose();
  };

  return (
    <Modal
      title={task ? "Editar item" : "Nuevo item de discovery"}
      subtitle={task ? task.name : "Se agrega al tablero del ciclo activo"}
      onClose={onClose}
      width={540}
    >
      <datalist id="known-people">
        {knownPeople.map((p) => (
          <option key={p} value={p} />
        ))}
      </datalist>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nombre">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Historial de órdenes — web/app"
            autoFocus
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Objetivo" flex={2}>
            <Select value={objectiveId} onChange={(e) => setObjectiveId(e.target.value)}>
              {objectives.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.obj_num >= 90 ? o.short_name : `Obj. ${o.obj_num} — ${o.short_name}`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Etapa">
            <Select value={stage} onChange={(e) => setStage(e.target.value as DiscoveryStageId)}>
              {DISCOVERY_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridad">
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DiscoveryPriority)}
            >
              <option value="high">Alta</option>
              <option value="med">Media</option>
              <option value="low">Baja</option>
            </Select>
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="PO responsable">
            <TextInput
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Juanita"
              list="known-people"
            />
          </Field>
          <Field label="Diseño">
            <TextInput
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              placeholder="Jael"
              list="known-people"
            />
          </Field>
        </div>
        <Field label="Link de Figma (opcional)">
          <TextInput
            value={figma}
            onChange={(e) => setFigma(e.target.value)}
            placeholder="https://www.figma.com/design/…"
          />
        </Field>
        <Field label="Updates / notas">
          <TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Estado actual, decisiones, contexto…"
            rows={3}
          />
        </Field>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
          }}
        >
          {task ? (
            <DangerConfirmButton
              label="Eliminar item"
              confirmLabel="Eliminar"
              onConfirm={() => {
                onDelete(task.id);
                onClose();
              }}
            />
          ) : (
            <span />
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <GhostButton onClick={onClose}>Cancelar</GhostButton>
            <PrimaryButton onClick={submit} disabled={!valid || saving}>
              {saving ? "Guardando…" : task ? "Guardar cambios" : "Crear item"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}
