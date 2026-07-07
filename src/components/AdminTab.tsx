"use client";

// Admin — catálogo de objetivos. Lo que se crea/edita acá alimenta el
// dropdown de bets (Estado del ciclo) y los objetivos de Discovery.

import { useState } from "react";
import type { ObjectiveRow } from "@/lib/types";
import { OBJ_COLOR_OPTIONS, tokenColor } from "@/lib/cycle-utils";
import { useObjectives } from "@/lib/objectives-context";
import {
  deleteObjective,
  insertObjective,
  unassignObjectiveTasks,
  updateObjective,
} from "@/lib/db";
import {
  DangerConfirmButton,
  ErrorBanner,
  Field,
  GhostButton,
  Modal,
  PrimaryButton,
  TextArea,
  TextInput,
  labelStyle,
} from "./ui";

export default function AdminTab() {
  const { objectives, reload } = useObjectives();
  const [form, setForm] = useState<ObjectiveRow | "new" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleActive = async (o: ObjectiveRow) => {
    const err = await updateObjective(o.id, { active: !o.active });
    if (err) {
      setError(err);
      return;
    }
    // Al desactivar, las tasks del ciclo activo quedan "sin objetivo".
    const unassignErr = o.active ? await unassignObjectiveTasks(o.num) : null;
    setError(unassignErr);
    await reload();
  };

  return (
    <>
      {error && <ErrorBanner message={`Error: ${error}`} />}
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
            <div style={{ fontSize: 13, fontWeight: 700 }}>Objetivos estratégicos</div>
            <div style={{ fontSize: 11, color: "rgb(var(--fg-3))", marginTop: 2 }}>
              Catálogo global · alimenta el dropdown de bets en Estado del ciclo y los objetivos de
              Discovery · click en una fila para editar
            </div>
          </div>
          <PrimaryButton onClick={() => setForm("new")}>＋ Nuevo objetivo</PrimaryButton>
        </div>

        <div
          style={{
            border: "1px solid rgb(var(--surface-2))",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "50px 40px 150px 1fr 170px 100px 90px",
              gap: 12,
              padding: "10px 16px",
              borderBottom: "1px solid rgb(var(--surface-2))",
              background: "rgb(var(--surface-1))",
            }}
          >
            {["Nº", "Color", "Nombre corto", "Etiqueta completa", "PO / Diseño", "Estado", ""].map(
              (h, i) => (
                <span key={i} style={{ ...labelStyle, marginBottom: 0 }}>
                  {h}
                </span>
              )
            )}
          </div>
          {objectives.length === 0 && (
            <div
              style={{
                padding: "40px 20px",
                textAlign: "center",
                fontSize: 12,
                color: "rgb(var(--fg-4))",
              }}
            >
              No hay objetivos en el catálogo. Crea el primero con “Nuevo objetivo”.
            </div>
          )}
          {objectives.map((o, i) => (
            <div
              key={o.id}
              onClick={() => setForm(o)}
              style={{
                display: "grid",
                gridTemplateColumns: "50px 40px 150px 1fr 170px 100px 90px",
                gap: 12,
                alignItems: "center",
                padding: "11px 16px",
                borderBottom:
                  i === objectives.length - 1 ? "none" : "1px solid rgb(var(--surface-2) / 0.6)",
                cursor: "pointer",
                opacity: o.active ? 1 : 0.45,
              }}
            >
              <span style={{ fontSize: 12.5, fontWeight: 700 }}>
                {o.num >= 90 ? "—" : o.num}
              </span>
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  background: tokenColor(o.color),
                }}
              />
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>{o.short_name}</span>
              <span style={{ fontSize: 12, color: "rgb(var(--fg-2))" }}>{o.label}</span>
              <span
                style={{
                  fontSize: 11,
                  color: o.po || o.designer ? "rgb(var(--fg-2))" : "rgb(var(--fg-4))",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {o.po || o.designer ? (
                  <>
                    {o.po || "—"} <span style={{ color: "rgb(var(--fg-4))" }}>·</span>{" "}
                    {o.designer || "—"}
                  </>
                ) : (
                  "sin asignar"
                )}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: o.active ? "rgb(var(--primary))" : "rgb(var(--fg-4))",
                }}
              >
                {o.active ? "Activo" : "Inactivo"}
              </span>
              <GhostButton
                onClick={(e) => {
                  e.stopPropagation();
                  toggleActive(o);
                }}
                style={{ padding: "5px 10px", fontSize: 10.5, justifySelf: "end" }}
              >
                {o.active ? "Desactivar" : "Activar"}
              </GhostButton>
            </div>
          ))}
        </div>

        <div style={{ fontSize: 10.5, color: "rgb(var(--fg-4))", marginTop: 10, lineHeight: 1.5 }}>
          Los objetivos inactivos dejan de ofrecerse en los dropdowns pero las bets existentes
          conservan su color y etiqueta. Los números ≥ 90 se muestran como categorías especiales
          (Arquitectura, Regulatorio, Asks).
        </div>
      </div>

      {form && (
        <ObjectiveFormModal
          objective={form === "new" ? null : form}
          existing={objectives}
          onClose={() => setForm(null)}
          onSaved={async () => {
            setForm(null);
            await reload();
          }}
        />
      )}
    </>
  );
}

// ── Form (crear / editar) ──────────────────────────────────

function ObjectiveFormModal({
  objective,
  existing,
  onClose,
  onSaved,
}: {
  objective: ObjectiveRow | null;
  existing: ObjectiveRow[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const nextNum = existing.length
    ? Math.max(0, ...existing.map((o) => o.num).filter((n) => n < 90)) + 1
    : 1;
  const [num, setNum] = useState(objective?.num ?? nextNum);
  const [shortName, setShortName] = useState(objective?.short_name ?? "");
  const [label, setLabel] = useState(objective?.label ?? "");
  const [color, setColor] = useState(objective?.color ?? "obj-99");
  const [shortDescription, setShortDescription] = useState(objective?.short_description ?? "");
  const [metric, setMetric] = useState(objective?.metric ?? "");
  const [po, setPo] = useState(objective?.po ?? "");
  const [designer, setDesigner] = useState(objective?.designer ?? "");
  const [active, setActive] = useState(objective?.active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numTaken =
    !objective && existing.some((o) => o.num === num);
  const valid = shortName.trim().length > 0 && label.trim().length > 0 && num >= 1 && !numTaken;

  const submit = async () => {
    if (!valid || saving) return;
    setSaving(true);
    const patch = {
      num,
      short_name: shortName.trim(),
      label: label.trim(),
      color,
      short_description: shortDescription.trim(),
      metric: metric.trim(),
      po: po.trim(),
      designer: designer.trim(),
      active,
    };
    const err = objective
      ? await updateObjective(objective.id, patch)
      : (await insertObjective({ ...patch, position: num })).error;
    if (!err && objective && objective.active && !active) {
      // Se desactivó desde el form: las tasks del ciclo activo quedan sin objetivo.
      await unassignObjectiveTasks(objective.num);
    }
    setSaving(false);
    if (err) {
      setError(err);
      return;
    }
    await onSaved();
  };

  const remove = async () => {
    if (!objective) return;
    const err = await deleteObjective(objective.id);
    if (err) {
      setError(err);
      return;
    }
    await onSaved();
  };

  return (
    <Modal
      title={objective ? "Editar objetivo" : "Nuevo objetivo"}
      subtitle={
        objective
          ? objective.label
          : "Se agrega al catálogo global — disponible en bets y Discovery"
      }
      onClose={onClose}
      width={480}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Número" flex={0}>
            <TextInput
              type="number"
              min={1}
              value={num}
              disabled={!!objective}
              onChange={(e) => setNum(Number(e.target.value))}
              style={{ width: 80, opacity: objective ? 0.5 : 1 }}
            />
          </Field>
          <Field label="Nombre corto">
            <TextInput
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="Pro / US Stocks / Chile"
              autoFocus={!objective}
            />
          </Field>
        </div>
        <Field label="Etiqueta completa">
          <TextInput
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Obj. 6 — Nombre del objetivo"
          />
        </Field>
        <Field label="Descripción corta">
          <TextArea
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="Una línea que resume el objetivo — se muestra en la card de Discovery"
            rows={2}
          />
        </Field>
        <Field label="Métricas de éxito">
          <TextInput
            value={metric}
            onChange={(e) => setMetric(e.target.value)}
            placeholder="10% de penetración pro · Fin 2026"
          />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="PO">
            <TextInput
              value={po}
              onChange={(e) => setPo(e.target.value)}
              placeholder="Juanita"
            />
          </Field>
          <Field label="Diseño">
            <TextInput
              value={designer}
              onChange={(e) => setDesigner(e.target.value)}
              placeholder="Jael"
            />
          </Field>
        </div>
        <Field label="Color">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {OBJ_COLOR_OPTIONS.map((c) => (
              <button
                key={c.token}
                onClick={() => setColor(c.token)}
                title={c.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border:
                    color === c.token
                      ? `1px solid ${tokenColor(c.token)}`
                      : "1px solid rgb(var(--surface-2))",
                  background:
                    color === c.token ? "rgb(var(--surface-1))" : "transparent",
                  color: "rgb(var(--fg-2))",
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: tokenColor(c.token),
                  }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </Field>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 12,
            color: "rgb(var(--fg-2))",
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
          />
          Activo (se ofrece en los dropdowns)
        </label>
        {numTaken && (
          <div style={{ fontSize: 11, color: "rgb(var(--error))" }}>
            Ya existe un objetivo con el número {num}.
          </div>
        )}
        {error && <div style={{ fontSize: 11, color: "rgb(var(--error))" }}>{error}</div>}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            marginTop: 4,
          }}
        >
          <div>
            {objective && (
              <DangerConfirmButton label="Eliminar" confirmLabel="Eliminar objetivo" onConfirm={remove} />
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <GhostButton onClick={onClose}>Cancelar</GhostButton>
            <PrimaryButton onClick={submit} disabled={!valid || saving}>
              {saving ? "Guardando…" : objective ? "Guardar cambios" : "Crear objetivo"}
            </PrimaryButton>
          </div>
        </div>
      </div>
    </Modal>
  );
}
