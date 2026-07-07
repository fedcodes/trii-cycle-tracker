"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
} from "@/lib/cycle-utils";
import { useObjectives } from "@/lib/objectives-context";
import {
  deleteDiscoveryTask,
  fetchBacklogIdeas,
  fetchDiscovery,
  insertDiscoveryObjective,
  insertDiscoveryTask,
  updateBacklogIdea,
  updateDiscoveryObjective,
  updateDiscoveryTask,
  updateObjective,
} from "@/lib/db";
import type { BacklogIdeaRow, BacklogStatus } from "@/lib/supabase";
import {
  STAGE_TO_BACKLOG_STATUS,
  importBacklogIdeaToDiscovery,
} from "@/lib/backlog-discovery";
import type { ObjectiveRow } from "@/lib/types";
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

const BACKLOG_STATUSES: BacklogStatus[] = [
  "Pending",
  "In Discovery",
  "In Design",
  "Completed Design",
  "In Betting Table",
  "In Development",
  "Completed",
  "Not Doing",
];

type TaskFormTarget = { task: DiscoveryTaskRow | null; stage: DiscoveryStageId };

export default function DiscoveryTab({ cycle }: { cycle: CycleRow }) {
  const {
    activeObjectives,
    colorOf,
    objectives: catalog,
    reload: reloadCatalog,
  } = useObjectives();
  const [objectives, setObjectives] = useState<DiscoveryObjectiveRow[]>([]);
  const [tasks, setTasks] = useState<DiscoveryTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formTarget, setFormTarget] = useState<TaskFormTarget | null>(null);
  const [backlogIdeas, setBacklogIdeas] = useState<BacklogIdeaRow[]>([]);
  const [showBacklogPicker, setShowBacklogPicker] = useState(false);
  const syncedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetchBacklogIdeas()
      .then((ideas) => {
        if (!cancelled) setBacklogIdeas(ideas);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    syncedRef.current = false;
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

  // Los objetivos del catálogo (Admin) aparecen acá automáticamente:
  // al cargar, se crea la card del ciclo para cada objetivo activo que falte.
  useEffect(() => {
    if (loading || syncedRef.current || activeObjectives.length === 0) return;
    syncedRef.current = true;
    const have = new Set(objectives.map((o) => o.obj_num));
    const missing = activeObjectives.filter((o) => !have.has(o.num));
    if (missing.length === 0) return;
    (async () => {
      let position = objectives.length
        ? Math.max(...objectives.map((o) => o.position)) + 1
        : 0;
      const created: DiscoveryObjectiveRow[] = [];
      for (const cat of missing) {
        const { data, error: err } = await insertDiscoveryObjective({
          cycle_id: cycle.id,
          obj_num: cat.num,
          name: cat.label,
          short_name: cat.short_name,
          description: "",
          metric: "",
          target: "",
          po: null,
          designer: null,
          context: null,
          position: position++,
        });
        if (err) {
          setError(err);
          return;
        }
        if (data) created.push(data);
      }
      if (created.length) setObjectives((prev) => [...prev, ...created]);
    })();
  }, [loading, activeObjectives, objectives, cycle.id]);

  const patchTask = useCallback(
    async (id: string, patch: Partial<DiscoveryTaskRow>) => {
      const current = tasks.find((t) => t.id === id);
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      const err = await updateDiscoveryTask(id, patch);
      if (err) {
        setError(err);
        return;
      }
      // Sync al backlog: la idea de origen sigue la etapa de la task.
      const backlogId =
        patch.backlog_id !== undefined ? patch.backlog_id : current?.backlog_id;
      if (backlogId && patch.stage && patch.stage !== current?.stage) {
        const status = STAGE_TO_BACKLOG_STATUS[patch.stage];
        const bErr = await updateBacklogIdea(backlogId, { status });
        if (bErr) setError(bErr);
        else
          setBacklogIdeas((prev) =>
            prev.map((b) => (b.id === backlogId ? { ...b, status } : b))
          );
      }
    },
    [tasks]
  );

  const removeTask = useCallback(async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const err = await deleteDiscoveryTask(id);
    if (err) setError(err);
  }, []);

  const createTask = useCallback(
    async (draft: TaskDraft) => {
      const position = tasks.length ? Math.max(...tasks.map((t) => t.position)) + 1 : 0;
      const { data, error: err } = await insertDiscoveryTask({
        ...draft,
        cycle_id: cycle.id,
        position,
      });
      if (err || !data) {
        setError(err ?? "No se pudo crear el item");
        return false;
      }
      setTasks((prev) => [...prev, data]);
      return true;
    },
    [tasks]
  );

  // Importa una idea del backlog como task del tablero (queda linkeada por backlog_id).
  const importFromBacklog = useCallback(
    async (idea: BacklogIdeaRow) => {
      const { task, syncedStatus, error: err } = await importBacklogIdeaToDiscovery(
        cycle.id,
        idea
      );
      if (err || !task) {
        setError(err ?? "No se pudo importar la idea");
        return false;
      }
      setTasks((prev) => [...prev, task]);
      if (syncedStatus)
        setBacklogIdeas((prev) =>
          prev.map((b) => (b.id === idea.id ? { ...b, status: syncedStatus } : b))
        );
      return true;
    },
    [cycle.id]
  );

  const patchObjective = useCallback(
    async (id: string, patch: Partial<DiscoveryObjectiveRow>) => {
      setObjectives((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
      const err = await updateDiscoveryObjective(id, patch);
      if (err) setError(err);
    },
    []
  );

  // PO / Diseño viven en el catálogo global (tab Admin).
  const patchCatalogObjective = useCallback(
    async (id: string, patch: Partial<ObjectiveRow>) => {
      const err = await updateObjective(id, patch);
      if (err) setError(err);
      else await reloadCatalog();
    },
    [reloadCatalog]
  );

  const objById = useMemo(
    () => new Map(objectives.map((o) => [o.id, o])),
    [objectives]
  );

  // Cards visibles: se ocultan los objetivos desactivados en Admin.
  const visibleObjectives = useMemo(() => {
    const catByNum = new Map(catalog.map((o) => [o.num, o]));
    return objectives.filter((o) => {
      const cat = catByNum.get(o.obj_num);
      return !cat || cat.active;
    });
  }, [objectives, catalog]);

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
      <ObjectivesOverview
        objectives={visibleObjectives}
        tasks={tasks}
        onPatch={patchObjective}
        onPatchCatalog={patchCatalogObjective}
      />

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
            {visibleObjectives.map((o) => (
              <LegendDot key={o.id} c={colorOf(o.obj_num)} label={o.short_name} />
            ))}
            <button
              onClick={() => setShowBacklogPicker(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "6px 11px",
                background: "rgb(var(--primary-dim))",
                color: "rgb(var(--primary))",
                border: "1px solid rgb(var(--primary-dim))",
                borderRadius: 5,
                fontFamily: "inherit",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "-0.003em",
                cursor: "pointer",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <path
                  d="M6 2 V10 M2 6 H10"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
              Agregar del backlog
            </button>
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
          objectives={visibleObjectives}
          knownPeople={knownPeople}
          onClose={() => setFormTarget(null)}
          onCreate={createTask}
          onPatch={patchTask}
          onDelete={removeTask}
        />
      )}

      {showBacklogPicker && (
        <BacklogPickerModal
          ideas={backlogIdeas}
          linkedIds={new Set(tasks.map((t) => t.backlog_id).filter(Boolean) as string[])}
          onImport={importFromBacklog}
          onClose={() => setShowBacklogPicker(false)}
        />
      )}
    </>
  );
}

// ── Backlog picker (importa ideas del backlog al tablero) ──

function BacklogPickerModal({
  ideas,
  linkedIds,
  onImport,
  onClose,
}: {
  ideas: BacklogIdeaRow[];
  linkedIds: Set<string>;
  onImport: (idea: BacklogIdeaRow) => Promise<boolean>;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BacklogStatus>("In Discovery");
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      ideas.filter((i) => {
        if (statusFilter !== "All" && i.status !== statusFilter) return false;
        if (
          search &&
          !`${i.idea} ${i.vertical} ${i.responsable}`
            .toLowerCase()
            .includes(search.toLowerCase())
        )
          return false;
        return true;
      }),
    [ideas, search, statusFilter]
  );

  const doImport = async (idea: BacklogIdeaRow) => {
    if (busyId) return;
    setBusyId(idea.id);
    await onImport(idea);
    setBusyId(null);
  };

  return (
    <Modal
      title="Agregar del backlog"
      subtitle="Las ideas importadas quedan linkeadas: mover la task actualiza su status en el backlog"
      onClose={onClose}
      width={640}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <TextInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar idea…"
              autoFocus
            />
          </div>
          <div style={{ width: 170 }}>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "All" | BacklogStatus)}
            >
              {["All", ...BACKLOG_STATUSES].map((s) => (
                <option key={s} value={s}>
                  {s === "All" ? "Todos los status" : s}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div
          style={{
            maxHeight: 380,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                fontSize: 11,
                color: "rgb(var(--fg-4))",
                fontStyle: "italic",
                padding: "24px 8px",
                textAlign: "center",
              }}
            >
              No hay ideas que coincidan.
            </div>
          ) : (
            filtered.map((idea) => {
              const linked = linkedIds.has(idea.id);
              return (
                <div
                  key={idea.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "9px 12px",
                    background: "rgb(var(--surface-1))",
                    border: "1px solid rgb(var(--surface-2))",
                    borderRadius: 6,
                    opacity: linked ? 0.55 : 1,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "rgb(var(--fg))",
                        lineHeight: 1.35,
                      }}
                    >
                      {idea.idea}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgb(var(--fg-3))",
                        marginTop: 2,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {[idea.vertical, idea.responsable, (idea.countries || []).join(" · "), idea.status]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  {linked ? (
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "rgb(var(--fg-4))",
                        flexShrink: 0,
                      }}
                    >
                      Ya en el tablero
                    </span>
                  ) : (
                    <button
                      onClick={() => doImport(idea)}
                      disabled={busyId !== null}
                      style={{
                        padding: "4px 10px",
                        background: "rgb(var(--primary-dim))",
                        color: "rgb(var(--primary))",
                        border: "none",
                        borderRadius: 4,
                        fontFamily: "inherit",
                        fontSize: 10.5,
                        fontWeight: 600,
                        cursor: busyId ? "wait" : "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {busyId === idea.id ? "Agregando…" : "Agregar"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <GhostButton onClick={onClose}>Cerrar</GhostButton>
        </div>
      </div>
    </Modal>
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
  onPatchCatalog,
}: {
  objectives: DiscoveryObjectiveRow[];
  tasks: DiscoveryTaskRow[];
  onPatch: (id: string, patch: Partial<DiscoveryObjectiveRow>) => void;
  onPatchCatalog: (id: string, patch: Partial<ObjectiveRow>) => void;
}) {
  const { colorOf, objectives: catalog } = useObjectives();
  const catByNum = useMemo(() => new Map(catalog.map((o) => [o.num, o])), [catalog]);

  return (
    <div style={{ padding: "18px 28px 0" }}>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Objetivos del ciclo</div>
        <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
          Desde el catálogo del tab Admin · click en PO / Design para reasignar
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: 8,
        }}
      >
        {objectives.map((o) => {
          const c = colorOf(o.obj_num);
          const cat = catByNum.get(o.obj_num);
          // Contenido desde el catálogo (Admin); fallback a los campos del ciclo
          // para cards viejas que aún guardan su propia descripción/métrica.
          const desc = cat?.short_description?.trim() || o.description;
          const metric =
            cat?.metric?.trim() ||
            [o.metric, o.target && o.target !== "—" ? o.target : ""]
              .filter((s) => s && s !== "—")
              .join(" · ");
          const taskCount = tasks.filter((t) => t.objective_id === o.id).length;
          // PO / Diseño: del catálogo (Admin) cuando el objetivo existe ahí;
          // los edits inline escriben allá. Fallback: la card del ciclo.
          const po = cat ? cat.po || null : o.po;
          const designer = cat ? cat.designer || null : o.designer;
          const commitPo = (v: string | null) =>
            cat ? onPatchCatalog(cat.id, { po: v ?? "" }) : onPatch(o.id, { po: v });
          const commitDesigner = (v: string | null) =>
            cat ? onPatchCatalog(cat.id, { designer: v ?? "" }) : onPatch(o.id, { designer: v });
          return (
            <div
              key={o.id}
              title={o.context ?? undefined}
              style={{
                background: "rgb(var(--surface-1))",
                border: "1px solid rgb(var(--surface-2))",
                borderLeft: `3px solid ${c}`,
                borderRadius: 7,
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
                {o.obj_num < 90 && (
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: "0.07em",
                      color: c,
                      textTransform: "uppercase",
                      flexShrink: 0,
                    }}
                  >
                    Obj. {o.obj_num}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: o.obj_num >= 90 ? c : "rgb(var(--fg))",
                    letterSpacing: "-0.005em",
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {o.short_name}
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    color: "rgb(var(--fg-4))",
                    fontVariantNumeric: "tabular-nums",
                    flexShrink: 0,
                  }}
                >
                  {taskCount} task{taskCount === 1 ? "" : "s"}
                </span>
              </div>

              {desc && (
                <div
                  style={{
                    fontSize: 10.5,
                    color: "rgb(var(--fg-3))",
                    lineHeight: 1.45,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical" as React.CSSProperties["WebkitBoxOrient"],
                    overflow: "hidden",
                  }}
                >
                  {desc}
                </div>
              )}

              {metric && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 6,
                    fontSize: 10.5,
                    fontWeight: 600,
                    color: "rgb(var(--fg-2))",
                  }}
                >
                  <span style={{ color: c, flexShrink: 0 }}>◆</span>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={metric}
                  >
                    {metric}
                  </span>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 10,
                  color: "rgb(var(--fg-3))",
                  marginTop: "auto",
                  paddingTop: 6,
                  borderTop: "1px solid rgb(var(--surface-2) / 0.6)",
                }}
              >
                <span>
                  PO{" "}
                  <InlinePerson value={po} placeholder="sin asignar" onCommit={commitPo} />
                </span>
                <span style={{ color: "rgb(var(--fg-4))" }}>·</span>
                <span>
                  Design{" "}
                  <InlinePerson
                    value={designer}
                    placeholder="sin asignar"
                    onCommit={commitDesigner}
                  />
                </span>
                {o.context && (
                  <span
                    style={{ marginLeft: "auto", color: "rgb(var(--yellow))", flexShrink: 0 }}
                    title={o.context}
                  >
                    ⚠
                  </span>
                )}
              </div>
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
            <DraggableTaskCard
              key={t.id}
              task={t}
              obj={t.objective_id ? objById.get(t.objective_id) : undefined}
              onOpen={onOpen}
            />
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
  const { colorOf } = useObjectives();
  const c = obj ? colorOf(obj.obj_num) : "rgb(var(--fg-4))";
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
          {!obj ? "Sin objetivo" : obj.obj_num >= 90 ? obj.short_name : `OBJ. ${obj.obj_num}`}
        </span>
        {task.backlog_id && (
          <span
            title="Linkeada al backlog — mover esta task actualiza su status allá"
            style={{
              fontSize: 8.5,
              fontWeight: 700,
              letterSpacing: "0.05em",
              color: "rgb(var(--fg-3))",
              background: "rgb(var(--surface-2))",
              padding: "1px 5px",
              borderRadius: 3,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Backlog
          </span>
        )}
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
          {obj && obj.obj_num < 90 ? obj.short_name : ""}
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

type TaskDraft = Omit<
  DiscoveryTaskRow,
  "id" | "cycle_id" | "created_at" | "updated_at" | "position"
>;

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
  // "" = sin objetivo. Al editar se respeta el valor actual (incluido null).
  const [objectiveId, setObjectiveId] = useState(
    task ? task.objective_id ?? "" : objectives[0]?.id ?? ""
  );
  const [stage, setStage] = useState<DiscoveryStageId>(task?.stage ?? target.stage);
  const [owner, setOwner] = useState(task?.owner ?? "");
  const [designer, setDesigner] = useState(task?.designer ?? "");
  const [priority, setPriority] = useState<DiscoveryPriority>(task?.priority ?? "med");
  const [figma, setFigma] = useState(task?.figma ?? "");
  const [notes, setNotes] = useState(task?.notes ?? "");
  const [saving, setSaving] = useState(false);

  const valid = name.trim().length > 0;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const draft: TaskDraft = {
      objective_id: objectiveId || null,
      backlog_id: task?.backlog_id ?? null,
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
              <option value="">Sin objetivo</option>
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
