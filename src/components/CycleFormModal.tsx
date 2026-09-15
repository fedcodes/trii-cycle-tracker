"use client";

import { useEffect, useMemo, useState } from "react";
import type { BetRow, CycleRow } from "@/lib/types";
import { cycleDatesLabel } from "@/lib/cycle-utils";
import { createNextCycle, fetchCycleData, updateCycle } from "@/lib/db";
import {
  Field,
  GhostButton,
  Modal,
  ObjChip,
  PrimaryButton,
  StatusDot,
  TeamStack,
  TextInput,
  labelStyle,
} from "./ui";

type Mode = "edit" | "new";

// Edit the active cycle, or open the next one (with bet transition).
// El engranaje abre en modo "edit"; desde ahí se pasa a "new" para cerrar
// el ciclo actual, crear el siguiente y decidir qué bets se mueven.
export default function CycleFormModal({
  cycle,
  onClose,
  onSaved,
}: {
  cycle: CycleRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>(cycle ? "edit" : "new");
  return (
    <CycleForm
      key={mode}
      mode={mode}
      cycle={cycle}
      onSwitchToNew={() => setMode("new")}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

// ── Fechas (YYYY-MM-DD, sin zona horaria) ──────────────────

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseISO = (s: string) => new Date(`${s}T00:00:00`);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
// Primer lunes estrictamente posterior a d.
const nextMonday = (d: Date) => addDays(d, (8 - d.getDay()) % 7 || 7);

// Propuesta para el siguiente ciclo a partir del actual: arranca el lunes
// después del cooldown, misma duración, cooldown de 2 semanas, nombre +1.
function suggestNext(prev: CycleRow | null) {
  if (!prev) return { name: "", start: "", end: "", cdStart: "", cdEnd: "", weeks: 6 };
  const weeks = prev.total_weeks;
  const start = nextMonday(parseISO(prev.cooldown_end ?? prev.end_date));
  const end = addDays(start, weeks * 7 - 3); // viernes de la última semana
  const cdStart = addDays(end, 3);
  const cdEnd = addDays(cdStart, 11);
  const m = prev.name.match(/^(.*?)(\d+)(.*)$/);
  const bumped = m ? `${m[1]}${Number(m[2]) + 1}${m[3]}` : "";
  const name = bumped.replace(/\b20\d{2}\b/, String(start.getFullYear()));
  return { name, start: toISO(start), end: toISO(end), cdStart: toISO(cdStart), cdEnd: toISO(cdEnd), weeks };
}

// Se archivan por defecto: completadas y descartadas. El resto sigue al nuevo ciclo.
const movesByDefault = (b: BetRow) => !b.dropped && b.status !== "Listo";

function CycleForm({
  mode,
  cycle,
  onSwitchToNew,
  onClose,
  onSaved,
}: {
  mode: Mode;
  cycle: CycleRow | null;
  onSwitchToNew: () => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const editing = mode === "edit" ? cycle : null;
  const previous = mode === "new" ? cycle : null;
  const suggested = useMemo(() => suggestNext(previous), [previous]);

  const [name, setName] = useState(editing?.name ?? suggested.name);
  const [startDate, setStartDate] = useState(editing?.start_date ?? suggested.start);
  const [endDate, setEndDate] = useState(editing?.end_date ?? suggested.end);
  const [cooldownStart, setCooldownStart] = useState(editing?.cooldown_start ?? suggested.cdStart);
  const [cooldownEnd, setCooldownEnd] = useState(editing?.cooldown_end ?? suggested.cdEnd);
  const [totalWeeks, setTotalWeeks] = useState(editing?.total_weeks ?? suggested.weeks);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Transición: bets del ciclo anterior y cuáles se mueven.
  const [prevBets, setPrevBets] = useState<BetRow[] | null>(previous ? null : []);
  const [moveIds, setMoveIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!previous) return;
    let cancelled = false;
    fetchCycleData(previous.id)
      .then(({ bets }) => {
        if (cancelled) return;
        setPrevBets(bets);
        setMoveIds(new Set(bets.filter(movesByDefault).map((b) => b.id)));
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [previous]);

  const toggleMove = (id: string) =>
    setMoveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const valid = Boolean(name.trim() && startDate && endDate) && (mode === "edit" || prevBets !== null);
  const moveCount = moveIds.size;
  const archiveCount = (prevBets?.length ?? 0) - moveCount;

  const save = async () => {
    if (!valid || saving) return;
    setSaving(true);
    setError(null);
    const patch = {
      name: name.trim(),
      start_date: startDate,
      end_date: endDate,
      cooldown_start: cooldownStart || null,
      cooldown_end: cooldownEnd || null,
      total_weeks: totalWeeks,
    };
    let err: string | null;
    if (editing) {
      err = await updateCycle(editing.id, patch);
    } else {
      const res = await createNextCycle(patch, previous?.id ?? null, [...moveIds]);
      err = res.error;
    }
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
    onClose();
  };

  const title = editing ? "Editar ciclo" : previous ? "Nuevo ciclo" : "Crear ciclo";
  const subtitle = editing
    ? "Nombre, ventana del ciclo y cooldown"
    : previous
      ? `Cierra ${previous.name} y abre el siguiente`
      : "Nombre, ventana del ciclo y cooldown";

  return (
    <Modal title={title} subtitle={subtitle} onClose={onClose} width={previous ? 620 : 480}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Nombre">
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ciclo 4 — 2026"
            autoFocus
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Inicio">
            <TextInput type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="Fin">
            <TextInput type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Cooldown inicio">
            <TextInput type="date" value={cooldownStart ?? ""} onChange={(e) => setCooldownStart(e.target.value)} />
          </Field>
          <Field label="Cooldown fin">
            <TextInput type="date" value={cooldownEnd ?? ""} onChange={(e) => setCooldownEnd(e.target.value)} />
          </Field>
        </div>
        <Field label="Semanas" flex={0}>
          <TextInput
            type="number"
            min={1}
            max={12}
            value={totalWeeks}
            onChange={(e) => setTotalWeeks(Math.max(1, Math.min(12, Number(e.target.value) || 6)))}
            style={{ width: 90 }}
          />
        </Field>

        {previous && (
          <BetTransition
            previous={previous}
            newName={name.trim() || "el nuevo ciclo"}
            bets={prevBets}
            moveIds={moveIds}
            onToggle={toggleMove}
          />
        )}

        {error && (
          <div style={{ fontSize: 11, color: "rgb(var(--error))" }}>Error: {error}</div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
          {editing && (
            <GhostButton onClick={onSwitchToNew} title="Cerrar este ciclo y abrir el siguiente">
              Nuevo ciclo →
            </GhostButton>
          )}
          <div style={{ flex: 1 }} />
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={save} disabled={!valid || saving}>
            {saving
              ? "Guardando…"
              : editing
                ? "Guardar"
                : previous
                  ? `Crear ciclo · mover ${moveCount} · archivar ${archiveCount}`
                  : "Crear ciclo"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}

// ── Transición de bets ─────────────────────────────────────

function BetTransition({
  previous,
  newName,
  bets,
  moveIds,
  onToggle,
}: {
  previous: CycleRow;
  newName: string;
  bets: BetRow[] | null;
  moveIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  const pending = (bets ?? []).filter(movesByDefault);
  const done = (bets ?? []).filter((b) => !movesByDefault(b));

  return (
    <div
      style={{
        border: "1px solid rgb(var(--surface-2))",
        borderRadius: 8,
        background: "rgb(var(--surface-0))",
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid rgb(var(--surface-2))" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700 }}>Transición de bets</div>
        <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2, lineHeight: 1.45 }}>
          Las marcadas se mueven a <b style={{ color: "rgb(var(--fg-2))" }}>{newName}</b> y arrancan en S1.
          Las demás quedan archivadas en {previous.name} ({cycleDatesLabel(previous)}) con su historial.
        </div>
      </div>

      {bets === null && (
        <div style={{ padding: "18px 14px", fontSize: 11.5, color: "rgb(var(--fg-4))", textAlign: "center" }}>
          Cargando bets de {previous.name}…
        </div>
      )}
      {bets !== null && bets.length === 0 && (
        <div style={{ padding: "18px 14px", fontSize: 11.5, color: "rgb(var(--fg-4))", textAlign: "center" }}>
          {previous.name} no tiene bets — nada que mover.
        </div>
      )}

      {pending.length > 0 && (
        <BetGroup
          label="Siguen al nuevo ciclo"
          hint="En curso, pendientes o pushed"
          bets={pending}
          moveIds={moveIds}
          onToggle={onToggle}
        />
      )}
      {done.length > 0 && (
        <BetGroup
          label="Se archivan"
          hint="Listo o descartadas"
          bets={done}
          moveIds={moveIds}
          onToggle={onToggle}
        />
      )}
    </div>
  );
}

function BetGroup({
  label,
  hint,
  bets,
  moveIds,
  onToggle,
}: {
  label: string;
  hint: string;
  bets: BetRow[];
  moveIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ padding: "10px 14px 12px", borderBottom: "1px solid rgb(var(--surface-2) / 0.6)" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ ...labelStyle, marginBottom: 0 }}>{label}</span>
        <span style={{ fontSize: 10, color: "rgb(var(--fg-4))" }}>{hint}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 10, color: "rgb(var(--fg-4))", fontVariantNumeric: "tabular-nums" }}>
          {bets.filter((b) => moveIds.has(b.id)).length}/{bets.length} se mueven
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {bets.map((b) => {
          const on = moveIds.has(b.id);
          return (
            <label
              key={b.id}
              style={{
                display: "grid",
                gridTemplateColumns: "auto auto 1fr auto",
                alignItems: "center",
                gap: 10,
                padding: "6px 6px",
                borderRadius: 5,
                cursor: "pointer",
                background: on ? "rgb(var(--primary) / 0.05)" : "transparent",
                opacity: on ? 1 : 0.7,
              }}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(b.id)}
                style={{ accentColor: "rgb(var(--primary))", margin: 0 }}
              />
              <StatusDot status={b.status} dropped={b.dropped} size={7} />
              <span style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: b.dropped ? "rgb(var(--fg-4))" : "rgb(var(--fg))",
                    textDecoration: b.dropped ? "line-through" : "none",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {b.name}
                </span>
                <ObjChip num={b.objective_num} />
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 10.5, color: "rgb(var(--fg-3))", whiteSpace: "nowrap" }}>
                  {b.dropped ? "Descartada" : b.status}
                  {!b.dropped && b.status !== "Listo" && b.status !== "Not started"
                    ? ` · ${Math.round((b.progress || 0) * 100)}%`
                    : ""}
                </span>
                <TeamStack team={b.team} />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
