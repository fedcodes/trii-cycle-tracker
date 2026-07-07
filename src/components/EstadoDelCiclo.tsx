"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BetRow, BetStatus, BetUpdateRow, CycleRow } from "@/lib/types";
import { BET_STATUSES } from "@/lib/types";
import {
  currentWeekOf,
  daysElapsedOf,
  statusToken,
  totalDays,
  weekLabel,
  weekToDays,
} from "@/lib/cycle-utils";
import { useObjectives } from "@/lib/objectives-context";
import {
  deleteBet,
  deleteBetUpdate,
  fetchCycleData,
  insertBet,
  insertBetUpdate,
  updateBet,
} from "@/lib/db";
import {
  DangerConfirmButton,
  ErrorBanner,
  Field,
  GhostButton,
  LegendDot,
  LoadingState,
  Modal,
  ObjChip,
  PrimaryButton,
  Select,
  StatusDot,
  TeamStack,
  TextArea,
  TextInput,
  labelStyle,
} from "./ui";

const parseTeam = (raw: string): string[] =>
  raw
    .split(/[,·\s]+/)
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

export default function EstadoDelCiclo({ cycle }: { cycle: CycleRow }) {
  const [bets, setBets] = useState<BetRow[]>([]);
  const [updates, setUpdates] = useState<BetUpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formBet, setFormBet] = useState<BetRow | "new" | null>(null);

  const currentWeek = currentWeekOf(cycle);

  const load = useCallback(async () => {
    try {
      const data = await fetchCycleData(cycle.id);
      setBets(data.bets);
      setUpdates(data.updates);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [cycle.id]);

  useEffect(() => {
    load();
  }, [load]);

  const patchBet = useCallback(async (id: string, patch: Partial<BetRow>) => {
    setBets((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const err = await updateBet(id, patch);
    if (err) setError(err);
  }, []);

  const removeBet = useCallback(async (id: string) => {
    setBets((prev) => prev.filter((b) => b.id !== id));
    setUpdates((prev) => prev.filter((u) => u.bet_id !== id));
    setSelectedId(null);
    const err = await deleteBet(id);
    if (err) setError(err);
  }, []);

  const addUpdate = useCallback(
    async (betId: string | null, note: string, week: number) => {
      const bet = betId ? bets.find((b) => b.id === betId) : null;
      const { data, error: err } = await insertBetUpdate({
        cycle_id: cycle.id,
        bet_id: betId,
        week,
        note,
        progress: bet ? bet.progress : null,
        status: bet ? bet.status : null,
      });
      if (err || !data) {
        setError(err ?? "No se pudo guardar el update");
        return;
      }
      setUpdates((prev) => [data, ...prev]);
      if (betId) patchBet(betId, { last_update: note });
    },
    [bets, cycle.id, patchBet]
  );

  const removeUpdate = useCallback(async (id: string) => {
    setUpdates((prev) => prev.filter((u) => u.id !== id));
    const err = await deleteBetUpdate(id);
    if (err) setError(err);
  }, []);

  const saveBet = useCallback(
    async (draft: BetDraft, existing: BetRow | null) => {
      if (existing) {
        await patchBet(existing.id, draft);
        return true;
      }
      const position = bets.length ? Math.max(...bets.map((b) => b.position)) + 1 : 0;
      const { data, error: err } = await insertBet({
        cycle_id: cycle.id,
        ...draft,
        last_update: draft.last_update ?? "",
        dropped: false,
        position,
      });
      if (err || !data) {
        setError(err ?? "No se pudo crear la bet");
        return false;
      }
      setBets((prev) => [...prev, data]);
      return true;
    },
    [bets, cycle.id, patchBet]
  );

  const selected = selectedId ? bets.find((b) => b.id === selectedId) ?? null : null;

  if (loading) return <LoadingState label="Cargando bets…" />;

  return (
    <>
      {error && <ErrorBanner message={`Error: ${error}`} />}
      <KPIStrip bets={bets} cycle={cycle} currentWeek={currentWeek} />
      <div
        style={{
          padding: "16px 28px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          position: "relative",
        }}
      >
        <Gantt
          bets={bets}
          cycle={cycle}
          onSelect={(b) => setSelectedId(b.id)}
          onNew={() => setFormBet("new")}
        />
        <WeeklyLog
          updates={updates}
          bets={bets}
          cycle={cycle}
          currentWeek={currentWeek}
          onAdd={(note, week) => addUpdate(null, note, week)}
          onDelete={removeUpdate}
        />
        {selected && (
          <ProjectDetail
            bet={selected}
            cycle={cycle}
            updates={updates.filter((u) => u.bet_id === selected.id)}
            currentWeek={currentWeek}
            onClose={() => setSelectedId(null)}
            onPatch={(patch) => patchBet(selected.id, patch)}
            onEdit={() => setFormBet(selected)}
            onDelete={() => removeBet(selected.id)}
            onAddUpdate={(note) => addUpdate(selected.id, note, currentWeek)}
            onDeleteUpdate={removeUpdate}
          />
        )}
      </div>
      {formBet && (
        <BetFormModal
          cycle={cycle}
          bet={formBet === "new" ? null : formBet}
          onClose={() => setFormBet(null)}
          onSave={saveBet}
        />
      )}
    </>
  );
}

// ── KPI strip ──────────────────────────────────────────────

function KPIStrip({
  bets,
  cycle,
  currentWeek,
}: {
  bets: BetRow[];
  cycle: CycleRow;
  currentWeek: number;
}) {
  const active = bets.filter((b) => !b.dropped);
  const count = (s: BetStatus) => active.filter((b) => b.status === s).length;
  const listo = count("Listo");
  const dropped = bets.length - active.length;
  const completedPct = active.length ? Math.round((listo / active.length) * 100) : 0;
  const start = new Date(`${cycle.start_date}T00:00:00`);
  const startLabel = `${start.toLocaleDateString("es", { month: "short" }).replace(".", "")} ${start.getDate()}`;

  const items = [
    { label: "Bets activas", value: active.length, sub: `${dropped} descartada${dropped === 1 ? "" : "s"}`, accent: "rgb(var(--fg))" },
    { label: "On track", value: count("On track"), sub: "En curso esta semana", accent: "rgb(var(--primary))" },
    { label: "Not started", value: count("Not started"), sub: "Pendientes en el ciclo", accent: "rgb(var(--fg-3))" },
    { label: "Listo", value: listo, sub: `${completedPct}% del ciclo`, accent: "rgb(var(--primary))" },
    { label: "Update", value: count("Update"), sub: "Requiere atención", accent: "rgb(var(--yellow))" },
    { label: `${cycle.name.split(" — ")[0]} · S${currentWeek}`, value: startLabel, sub: `Semana ${currentWeek} de ${cycle.total_weeks}`, accent: "rgb(var(--primary))" },
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

// ── Gantt ──────────────────────────────────────────────────

function Gantt({
  bets,
  cycle,
  onSelect,
  onNew,
}: {
  bets: BetRow[];
  cycle: CycleRow;
  onSelect: (b: BetRow) => void;
  onNew: () => void;
}) {
  const { colorOf, activeObjectives } = useObjectives();
  const leftW = 300;
  const TOTAL = totalDays(cycle);
  const currentDayIdx = daysElapsedOf(cycle);
  const todayPct = ((currentDayIdx + 0.5) / TOTAL) * 100;
  const weeks = Array.from({ length: cycle.total_weeks }, (_, i) => i + 1);
  const currentWeek = currentWeekOf(cycle);

  // Leyenda: objetivos del catálogo presentes en las bets del ciclo.
  const betNums = new Set(bets.map((b) => b.objective_num));
  const legend = activeObjectives.filter((o) => betNums.has(o.num));

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
          alignItems: "center",
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
            {bets.length} proyectos · click para ver detalle y agregar updates
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          {legend.map((o) => (
            <LegendDot key={o.id} c={colorOf(o.num)} label={o.short_name} />
          ))}
          <PrimaryButton onClick={onNew} style={{ padding: "6px 12px" }}>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M6 2 V10 M2 6 H10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Nueva bet
          </PrimaryButton>
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
          {weeks.map((w) => {
            const isCurrent = w === currentWeek;
            const start = new Date(`${cycle.start_date}T00:00:00`);
            const d = new Date(start);
            d.setDate(d.getDate() + weekToDays(w).start);
            const monthStr = d.toLocaleDateString("es", { month: "short" }).replace(".", "");
            return (
              <div
                key={w}
                style={{
                  position: "absolute",
                  left: `${((w - 1) / cycle.total_weeks) * 100}%`,
                  width: `${(1 / cycle.total_weeks) * 100}%`,
                  top: 0,
                  height: 30,
                  borderRight: w < cycle.total_weeks ? "1px solid rgb(var(--surface-2))" : "none",
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
                    · {monthStr} {d.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ position: "relative" }}>
        {bets.length === 0 && (
          <div
            style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "rgb(var(--fg-4))",
              fontSize: 11.5,
            }}
          >
            Sin bets en el ciclo. Agrega la primera con &quot;Nueva bet&quot;.
          </div>
        )}
        {bets.map((bet, i) => (
          <GanttRow
            key={bet.id}
            bet={bet}
            cycle={cycle}
            leftW={leftW}
            isLast={i === bets.length - 1}
            onSelect={onSelect}
          />
        ))}
        {bets.length > 0 && (
          <div
            style={{
              position: "absolute",
              left: `calc(${leftW}px + (100% - ${leftW}px) * ${todayPct / 100})`,
              top: 0,
              bottom: 0,
              width: 2,
              background: "rgb(var(--primary))",
              boxShadow: "0 0 8px rgb(var(--primary) / 0.4)",
              zIndex: 5,
              pointerEvents: "none",
            }}
          />
        )}
      </div>
    </div>
  );
}

function GanttRow({
  bet,
  cycle,
  leftW,
  isLast,
  onSelect,
}: {
  bet: BetRow;
  cycle: CycleRow;
  leftW: number;
  isLast: boolean;
  onSelect: (b: BetRow) => void;
}) {
  const { colorOf } = useObjectives();
  const obj = colorOf(bet.objective_num);
  const TOTAL = totalDays(cycle);
  const wkS = weekToDays(bet.week_start);
  const wkE = weekToDays(bet.week_end);
  const toPct = (day: number) => (day / TOTAL) * 100;
  const barLeftPct = toPct(wkS.start);
  const barWidthPct = toPct(wkE.end - wkS.start + 1);
  const [hover, setHover] = useState(false);

  const barBg = bet.dropped
    ? "rgb(var(--surface-2))"
    : bet.status === "Listo"
      ? obj
      : bet.status === "Cooldown"
        ? `color-mix(in oklab, ${obj} 35%, transparent)`
        : bet.status === "Pushed"
          ? "rgb(var(--surface-2))"
          : bet.status === "Update"
            ? "rgb(var(--yellow-dim))"
            : bet.status === "Not started"
              ? "rgb(var(--surface-2))"
              : `color-mix(in oklab, ${obj} 20%, transparent)`;

  const barBorder =
    bet.status === "Not started" || bet.status === "Pushed" || bet.dropped
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
          <ObjChip num={bet.objective_num} />
          <span style={{ color: "rgb(var(--fg-4))" }}>·</span>
          <TeamStack team={bet.team} />
        </div>
      </div>

      <div style={{ position: "relative", overflow: "hidden" }}>
        {Array.from({ length: cycle.total_weeks - 1 }, (_, i) => i + 1).map((w) => (
          <div
            key={w}
            style={{
              position: "absolute",
              left: `${(w / cycle.total_weeks) * 100}%`,
              top: 0,
              bottom: 0,
              width: 1,
              background: "rgb(var(--surface-2) / 0.6)",
            }}
          />
        ))}
        {Array.from({ length: cycle.total_weeks }, (_, i) => i).map((w) => (
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
                background: bet.status === "Update" ? "rgb(var(--yellow) / 0.5)" : obj,
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
              color:
                bet.status === "Listo"
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
            {bet.status === "Pushed" ? (
              <span style={{ color: "rgb(var(--fg-3))", fontStyle: "italic" }}>Pushed →</span>
            ) : (
              !bet.dropped &&
              bet.status !== "Not started" && <span>{Math.round((bet.progress || 0) * 100)}%</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Weekly log ─────────────────────────────────────────────

function WeeklyLog({
  updates,
  bets,
  cycle,
  currentWeek,
  onAdd,
  onDelete,
}: {
  updates: BetUpdateRow[];
  bets: BetRow[];
  cycle: CycleRow;
  currentWeek: number;
  onAdd: (note: string, week: number) => void;
  onDelete: (id: string) => void;
}) {
  const groups = useMemo(() => {
    const byWeek = new Map<number, BetUpdateRow[]>();
    updates.forEach((u) => {
      const arr = byWeek.get(u.week) ?? [];
      arr.push(u);
      byWeek.set(u.week, arr);
    });
    return [...byWeek.entries()].sort((a, b) => b[0] - a[0]);
  }, [updates]);

  const [expanded, setExpanded] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState("");
  const [week, setWeek] = useState(currentWeek);
  const betName = (id: string | null) => (id ? bets.find((b) => b.id === id)?.name ?? null : null);

  const openWeek = expanded ?? groups[0]?.[0] ?? null;

  const submit = () => {
    if (!note.trim()) return;
    onAdd(note.trim(), week);
    setNote("");
    setAdding(false);
    setExpanded(week);
  };

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
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700 }}>Weekly log</div>
        <div style={{ fontSize: 11, color: "rgb(var(--fg-3))" }}>
          Updates de bets y notas generales por semana
        </div>
        <div style={{ flex: 1 }} />
        <div
          style={{
            fontSize: 10.5,
            color: "rgb(var(--fg-4))",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {updates.length} entrada{updates.length === 1 ? "" : "s"}
        </div>
        <GhostButton onClick={() => setAdding((a) => !a)} style={{ padding: "5px 10px", fontSize: 10.5 }}>
          + Nota general
        </GhostButton>
      </div>

      {adding && (
        <div
          style={{
            padding: "12px 18px",
            borderBottom: "1px solid rgb(var(--surface-2))",
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            background: "rgb(var(--surface-0))",
          }}
        >
          <Select
            value={week}
            onChange={(e) => setWeek(Number(e.target.value))}
            style={{ width: 110, flexShrink: 0 }}
          >
            {Array.from({ length: cycle.total_weeks }, (_, i) => i + 1).map((w) => (
              <option key={w} value={w}>
                Semana {w}
              </option>
            ))}
          </Select>
          <TextArea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Qué pasó esta semana…"
            rows={2}
            autoFocus
            style={{ flex: 1 }}
          />
          <PrimaryButton onClick={submit} disabled={!note.trim()}>
            Guardar
          </PrimaryButton>
        </div>
      )}

      {groups.length === 0 && (
        <div style={{ padding: "30px 20px", textAlign: "center", color: "rgb(var(--fg-4))", fontSize: 11.5 }}>
          Sin entradas todavía.
        </div>
      )}

      {groups.map(([w, items]) => {
        const isOpen = openWeek === w;
        const isCurrent = w === currentWeek;
        return (
          <div
            key={w}
            style={{ borderBottom: "1px solid rgb(var(--surface-2) / 0.6)" }}
          >
            <button
              onClick={() => setExpanded(isOpen ? -1 : w)}
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
                Semana {w}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: "rgb(var(--fg-3))",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {weekLabel(cycle, w)} ·{" "}
                <span style={{ color: "rgb(var(--fg-4))" }}>
                  {items.length} update{items.length === 1 ? "" : "s"}
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
                {items.map((u) => {
                  const name = betName(u.bet_id);
                  return (
                    <li
                      key={u.id}
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
                      <span style={{ flex: 1 }}>
                        {name && (
                          <span style={{ fontWeight: 700, color: "rgb(var(--fg))" }}>{name}: </span>
                        )}
                        {u.note}
                      </span>
                      <button
                        onClick={() => onDelete(u.id)}
                        title="Eliminar entrada"
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "rgb(var(--fg-4))",
                          cursor: "pointer",
                          fontSize: 12,
                          lineHeight: 1,
                          padding: "0 2px",
                          flexShrink: 0,
                        }}
                      >
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Project detail drawer (editable) ───────────────────────

function ProjectDetail({
  bet,
  cycle,
  updates,
  currentWeek,
  onClose,
  onPatch,
  onEdit,
  onDelete,
  onAddUpdate,
  onDeleteUpdate,
}: {
  bet: BetRow;
  cycle: CycleRow;
  updates: BetUpdateRow[];
  currentWeek: number;
  onClose: () => void;
  onPatch: (patch: Partial<BetRow>) => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddUpdate: (note: string) => void;
  onDeleteUpdate: (id: string) => void;
}) {
  const { colorOf } = useObjectives();
  const c = colorOf(bet.objective_num);
  const t = statusToken(bet.status, bet.dropped);
  const [progressPct, setProgressPct] = useState(Math.round((bet.progress || 0) * 100));
  const [note, setNote] = useState("");

  useEffect(() => {
    setProgressPct(Math.round((bet.progress || 0) * 100));
  }, [bet.id, bet.progress]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const commitProgress = () => {
    const p = Math.max(0, Math.min(100, progressPct)) / 100;
    if (p !== bet.progress) onPatch({ progress: p });
  };

  const submitUpdate = () => {
    if (!note.trim()) return;
    onAddUpdate(note.trim());
    setNote("");
  };

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
        style={{ position: "absolute", inset: 0, background: "rgb(0 0 0 / 0.5)" }}
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
            <ObjChip num={bet.objective_num} />
            <div style={{ display: "flex", gap: 6 }}>
              <button
                onClick={onEdit}
                title="Editar bet"
                style={{
                  padding: "4px 10px",
                  borderRadius: 5,
                  border: "1px solid rgb(var(--surface-2))",
                  background: "rgb(var(--surface-1))",
                  color: "rgb(var(--fg-2))",
                  fontSize: 10.5,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Editar
              </button>
              <button
                onClick={onClose}
                aria-label="Cerrar"
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
              >
                ×
              </button>
            </div>
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

        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgb(var(--surface-2))" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={labelStyle}>Estado</div>
              <div style={{ position: "relative", display: "inline-block" }}>
                <select
                  value={bet.status}
                  onChange={(e) => onPatch({ status: e.target.value as BetStatus })}
                  style={{
                    appearance: "none",
                    WebkitAppearance: "none",
                    background: t.bg,
                    color: t.fg,
                    border: "none",
                    borderRadius: 4,
                    padding: "5px 22px 5px 22px",
                    fontFamily: "inherit",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {BET_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <span
                  style={{
                    position: "absolute",
                    left: 8,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: t.dot,
                    pointerEvents: "none",
                  }}
                />
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  style={{
                    position: "absolute",
                    right: 7,
                    top: "50%",
                    transform: "translateY(-50%)",
                    pointerEvents: "none",
                    color: t.fg,
                    opacity: 0.7,
                  }}
                >
                  <path d="M1 2.5 L4 5.5 L7 2.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Avance · {progressPct}%</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={progressPct}
                  onChange={(e) => setProgressPct(Number(e.target.value))}
                  onPointerUp={commitProgress}
                  onKeyUp={commitProgress}
                  style={{ flex: 1, accentColor: c, cursor: "pointer" }}
                />
              </div>
            </div>
            <div>
              <div style={labelStyle}>Calendario</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Select
                  value={bet.week_start}
                  onChange={(e) => {
                    const ws = Number(e.target.value);
                    onPatch({ week_start: ws, week_end: Math.max(ws, bet.week_end) });
                  }}
                  style={{ width: 64, padding: "4px 18px 4px 8px", fontSize: 11 }}
                >
                  {Array.from({ length: cycle.total_weeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      S{w}
                    </option>
                  ))}
                </Select>
                <span style={{ color: "rgb(var(--fg-4))", fontSize: 11 }}>→</span>
                <Select
                  value={bet.week_end}
                  onChange={(e) => {
                    const we = Number(e.target.value);
                    onPatch({ week_end: we, week_start: Math.min(we, bet.week_start) });
                  }}
                  style={{ width: 64, padding: "4px 18px 4px 8px", fontSize: 11 }}
                >
                  {Array.from({ length: cycle.total_weeks }, (_, i) => i + 1).map((w) => (
                    <option key={w} value={w}>
                      S{w}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <div>
              <div style={labelStyle}>Equipo</div>
              <TeamStack team={bet.team} />
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 22px", borderBottom: "1px solid rgb(var(--surface-2))" }}>
          <div style={{ ...labelStyle, marginBottom: 7 }}>Último update</div>
          <div
            style={{
              fontSize: 12.5,
              color: "rgb(var(--fg-2))",
              lineHeight: 1.5,
              textWrap: "pretty" as React.CSSProperties["textWrap"],
            }}
          >
            {bet.last_update || "—"}
          </div>
        </div>

        <div style={{ padding: "16px 22px 24px", flex: 1 }}>
          <div style={{ ...labelStyle, marginBottom: 7 }}>
            Agregar update · Semana {currentWeek}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start", marginBottom: 18 }}>
            <TextArea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Qué pasó con esta bet…"
              rows={2}
              style={{ flex: 1 }}
            />
            <PrimaryButton onClick={submitUpdate} disabled={!note.trim()}>
              Guardar
            </PrimaryButton>
          </div>

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
              {updates.length} update{updates.length === 1 ? "" : "s"}
            </div>
          </div>
          {updates.length > 0 ? (
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
                  key={u.id}
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
                  <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 3 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "rgb(var(--fg))" }}>
                      Semana {u.week}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "rgb(var(--fg-4))",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {weekLabel(cycle, u.week)}
                      {u.progress !== null && ` · ${Math.round(u.progress * 100)}%`}
                    </div>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() => onDeleteUpdate(u.id)}
                      title="Eliminar update"
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "rgb(var(--fg-4))",
                        cursor: "pointer",
                        fontSize: 12,
                        lineHeight: 1,
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: "rgb(var(--fg-2))",
                      lineHeight: 1.5,
                      textWrap: "pretty" as React.CSSProperties["textWrap"],
                    }}
                  >
                    {u.note}
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
              Sin updates registrados para esta bet.
            </div>
          )}

          <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", gap: 8 }}>
            <label
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                fontSize: 11,
                color: "rgb(var(--fg-3))",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={bet.dropped}
                onChange={(e) => onPatch({ dropped: e.target.checked })}
                style={{ accentColor: "rgb(var(--primary))" }}
              />
              Descartada del ciclo
            </label>
            <DangerConfirmButton label="Eliminar bet" confirmLabel="Eliminar" onConfirm={onDelete} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Bet form (create / edit) ───────────────────────────────

type BetDraft = Pick<
  BetRow,
  "name" | "objective_num" | "objective" | "team" | "status" | "week_start" | "week_end" | "progress"
> & { last_update?: string };

function BetFormModal({
  cycle,
  bet,
  onClose,
  onSave,
}: {
  cycle: CycleRow;
  bet: BetRow | null;
  onClose: () => void;
  onSave: (draft: BetDraft, existing: BetRow | null) => Promise<boolean>;
}) {
  const { activeObjectives, shortOf, labelOf } = useObjectives();
  const defaultNum = activeObjectives[0]?.num ?? 1;
  const [name, setName] = useState(bet?.name ?? "");
  const [objNum, setObjNum] = useState(bet?.objective_num ?? defaultNum);
  const [objective, setObjective] = useState(bet?.objective ?? labelOf(defaultNum));

  // Nums ofrecidos: catálogo activo + el num actual de la bet (aunque esté inactivo o borrado).
  const objNums = activeObjectives.map((o) => o.num);
  if (bet && !objNums.includes(bet.objective_num)) objNums.push(bet.objective_num);
  const [teamRaw, setTeamRaw] = useState(bet?.team.join(", ") ?? "");
  const [status, setStatus] = useState<BetStatus>(bet?.status ?? "Not started");
  const [weekStart, setWeekStart] = useState(bet?.week_start ?? 1);
  const [weekEnd, setWeekEnd] = useState(bet?.week_end ?? cycle.total_weeks);
  const [lastUpdate, setLastUpdate] = useState(bet?.last_update ?? "");
  const [saving, setSaving] = useState(false);

  const valid = name.trim().length > 0 && weekStart <= weekEnd;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const ok = await onSave(
      {
        name: name.trim(),
        objective_num: objNum,
        objective: objective.trim() || labelOf(objNum),
        team: parseTeam(teamRaw),
        status,
        week_start: weekStart,
        week_end: weekEnd,
        progress: bet?.progress ?? 0,
        last_update: lastUpdate.trim(),
      },
      bet
    );
    setSaving(false);
    if (ok) onClose();
  };

  const weeks = Array.from({ length: cycle.total_weeks }, (_, i) => i + 1);

  return (
    <Modal
      title={bet ? "Editar bet" : "Nueva bet"}
      subtitle={bet ? bet.name : `Se agrega a ${cycle.name}`}
      onClose={onClose}
      width={540}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nombre del proyecto">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Stop loss / Take Profit Colombia"
            autoFocus
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Objetivo">
            <Select
              value={objNum}
              onChange={(e) => {
                const n = Number(e.target.value);
                setObjNum(n);
                setObjective(labelOf(n));
              }}
            >
              {objNums.map((n) => (
                <option key={n} value={n}>
                  {shortOf(n)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select value={status} onChange={(e) => setStatus(e.target.value as BetStatus)}>
              {BET_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Etiqueta del objetivo">
          <TextInput
            value={objective}
            onChange={(e) => setObjective(e.target.value)}
            placeholder="Obj. 1 — Escalar trii pro"
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Equipo (iniciales)">
            <TextInput
              value={teamRaw}
              onChange={(e) => setTeamRaw(e.target.value)}
              placeholder="JR, AV"
            />
          </Field>
          <Field label="Semana inicio" flex={0}>
            <Select
              value={weekStart}
              onChange={(e) => setWeekStart(Number(e.target.value))}
              style={{ width: 80 }}
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  S{w}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Semana fin" flex={0}>
            <Select
              value={weekEnd}
              onChange={(e) => setWeekEnd(Number(e.target.value))}
              style={{ width: 80 }}
            >
              {weeks.map((w) => (
                <option key={w} value={w}>
                  S{w}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Último update (opcional)">
          <TextArea
            value={lastUpdate}
            onChange={(e) => setLastUpdate(e.target.value)}
            placeholder="Contexto o estado actual de la bet…"
            rows={2}
          />
        </Field>
        {!valid && name.trim() && (
          <div style={{ fontSize: 11, color: "rgb(var(--error))" }}>
            La semana de inicio debe ser ≤ a la semana de fin.
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={submit} disabled={!valid || saving}>
            {saving ? "Guardando…" : bet ? "Guardar cambios" : "Crear bet"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
