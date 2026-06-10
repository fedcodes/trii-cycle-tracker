"use client";

import { useState } from "react";
import type { CycleRow } from "@/lib/types";
import { getSupabase } from "@/lib/supabase";
import { updateCycle } from "@/lib/db";
import { Field, GhostButton, Modal, PrimaryButton, TextInput } from "./ui";

// Create or edit the active cycle (name + dates + cooldown window).
export default function CycleFormModal({
  cycle,
  onClose,
  onSaved,
}: {
  cycle: CycleRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(cycle?.name ?? "");
  const [startDate, setStartDate] = useState(cycle?.start_date ?? "");
  const [endDate, setEndDate] = useState(cycle?.end_date ?? "");
  const [cooldownStart, setCooldownStart] = useState(cycle?.cooldown_start ?? "");
  const [cooldownEnd, setCooldownEnd] = useState(cycle?.cooldown_end ?? "");
  const [totalWeeks, setTotalWeeks] = useState(cycle?.total_weeks ?? 6);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() && startDate && endDate;

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
    if (cycle) {
      err = await updateCycle(cycle.id, patch);
    } else {
      const { error: e } = await getSupabase()
        .from("cycles")
        .insert({ ...patch, is_active: true });
      err = e?.message ?? null;
    }
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    onSaved();
    onClose();
  };

  return (
    <Modal
      title={cycle ? "Editar ciclo" : "Nuevo ciclo"}
      subtitle="Nombre, ventana del ciclo y cooldown"
      onClose={onClose}
      width={480}
    >
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
        {error && (
          <div style={{ fontSize: 11, color: "rgb(var(--error))" }}>Error: {error}</div>
        )}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <GhostButton onClick={onClose}>Cancelar</GhostButton>
          <PrimaryButton onClick={save} disabled={!valid || saving}>
            {saving ? "Guardando…" : "Guardar"}
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
