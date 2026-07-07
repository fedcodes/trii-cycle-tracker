// Color tokens, status badges and week math shared across tabs.

import type { BetStatus, CycleRow, DiscoveryStage } from "./types";

export const weekToDays = (w: number) => ({ start: (w - 1) * 7, end: (w - 1) * 7 + 4 });

export const totalDays = (cycle: Pick<CycleRow, "total_weeks">) => cycle.total_weeks * 7;

// Semana actual derivada de la fecha real, acotada a [1, total_weeks].
export const currentWeekOf = (cycle: CycleRow, now: Date = new Date()): number => {
  const start = new Date(`${cycle.start_date}T00:00:00`);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(1, Math.min(cycle.total_weeks, Math.floor(diffDays / 7) + 1));
};

export const daysElapsedOf = (cycle: CycleRow, now: Date = new Date()): number => {
  const start = new Date(`${cycle.start_date}T00:00:00`);
  const diff = Math.floor((now.getTime() - start.getTime()) / 86400000);
  return Math.max(0, Math.min(totalDays(cycle) - 1, diff));
};

const fmtShort = (d: Date) =>
  `${d.toLocaleDateString("es", { month: "short" }).replace(".", "")} ${d.getDate()}`;

// "May 25-29" — etiqueta de la semana N del ciclo (lunes a viernes).
export const weekLabel = (cycle: CycleRow, week: number): string => {
  const start = new Date(`${cycle.start_date}T00:00:00`);
  const mon = new Date(start);
  mon.setDate(mon.getDate() + (week - 1) * 7);
  const fri = new Date(mon);
  fri.setDate(fri.getDate() + 4);
  const month = mon.toLocaleDateString("es", { month: "short" }).replace(".", "");
  return mon.getMonth() === fri.getMonth()
    ? `${capitalize(month)} ${mon.getDate()}-${fri.getDate()}`
    : `${capitalize(fmtShort(mon))} - ${capitalize(fmtShort(fri))}`;
};

// "May 11 → Jun 19, 2026"
export const cycleDatesLabel = (cycle: CycleRow): string => {
  const s = new Date(`${cycle.start_date}T00:00:00`);
  const e = new Date(`${cycle.end_date}T00:00:00`);
  return `${capitalize(fmtShort(s))} → ${capitalize(fmtShort(e))}, ${e.getFullYear()}`;
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// ── Objetivos ──────────────────────────────────────────────
// El catálogo vive en la tabla `objectives` (tab Admin) y se consume vía
// ObjectivesProvider / useObjectives. Lo de abajo son los fallbacks
// hardcodeados para cuando el catálogo aún no cargó.
export const OBJECTIVE_NUMS = [1, 2, 3, 4, 5, 98, 99] as const;

// Paleta disponible para el catálogo (tokens definidos en globals.css).
export const OBJ_COLOR_OPTIONS: { token: string; label: string }[] = [
  { token: "obj-1", label: "Verde" },
  { token: "obj-2", label: "Azul" },
  { token: "obj-3", label: "Ámbar" },
  { token: "obj-4", label: "Cobre" },
  { token: "obj-5", label: "Lila" },
  { token: "obj-99", label: "Gris" },
];

export const tokenColor = (token: string) => `rgb(var(--${token}))`;

export const objColor = (n: number): string => {
  const map: Record<number, string> = { 1: "obj-1", 2: "obj-2", 3: "obj-3", 4: "obj-4", 5: "obj-5", 98: "obj-99", 99: "obj-99" };
  return `rgb(var(--${map[n] ?? "obj-99"}))`;
};

export const objShort = (n: number): string => {
  const map: Record<number, string> = {
    1: "Obj 1 · Pro",
    2: "Obj 2 · US Stocks",
    3: "Obj 3 · Chile",
    4: "Obj 4 · CX",
    5: "Obj 5 · Fondos PE",
    98: "Arquitectura",
    99: "Regulatorio",
  };
  return map[n] ?? `Obj ${n}`;
};

export const OBJECTIVE_LABELS: Record<number, string> = {
  1: "Obj. 1 — Escalar trii pro",
  2: "Obj. 2 — US Stocks CO & PE",
  3: "Obj. 3 — Chile",
  4: "Obj. 4 — Experiencia CX",
  5: "Obj. 5 — Fondos Perú",
  98: "Arquitectura",
  99: "Regulatorio",
};

// ── Status ─────────────────────────────────────────────────
export interface StatusTokens {
  fg: string;
  bg: string;
  dot: string;
}

export const statusToken = (status: BetStatus, dropped?: boolean): StatusTokens => {
  if (dropped) return { fg: "rgb(var(--fg-3))", bg: "rgb(var(--surface-2))", dot: "rgb(var(--fg-4))" };
  const m: Record<BetStatus, StatusTokens> = {
    "On track": { fg: "rgb(var(--primary))", bg: "rgb(var(--primary-dim))", dot: "rgb(var(--primary))" },
    "Listo": { fg: "rgb(var(--primary))", bg: "rgb(var(--primary-dim))", dot: "rgb(var(--primary))" },
    "Cooldown": { fg: "rgb(var(--primary))", bg: "rgb(var(--primary-dim))", dot: "rgb(var(--primary))" },
    "Update": { fg: "rgb(var(--yellow))", bg: "rgb(var(--yellow-dim))", dot: "rgb(var(--yellow))" },
    "Blocked": { fg: "rgb(var(--error))", bg: "rgb(var(--error-dim))", dot: "rgb(var(--error))" },
    "Not started": { fg: "rgb(var(--fg-2))", bg: "rgb(var(--surface-2))", dot: "rgb(var(--fg-3))" },
    "Pushed": { fg: "rgb(var(--fg-3))", bg: "rgb(var(--surface-2))", dot: "rgb(var(--fg-4))" },
  };
  return m[status] || m["Not started"];
};

// ── Discovery ──────────────────────────────────────────────
export const DISCOVERY_STAGES: DiscoveryStage[] = [
  { id: "backlog", label: "Backlog", desc: "Ideas y pitches por priorizar" },
  { id: "research", label: "Research", desc: "PO y diseño alineando scope" },
  { id: "design", label: "Design", desc: "Wireframes / UI en progreso" },
  { id: "ready", label: "Ready", desc: "Listo para desarrollo" },
];

export const STAGE_TONES: Record<string, string> = {
  backlog: "rgb(var(--fg-3))",
  research: "rgb(var(--blue))",
  design: "rgb(var(--yellow))",
  ready: "rgb(var(--primary))",
};

export const PRIORITY_TONES: Record<string, { c: string; label: string }> = {
  high: { c: "rgb(var(--red))", label: "Alta" },
  med: { c: "rgb(var(--yellow))", label: "Media" },
  low: { c: "rgb(var(--fg-4))", label: "Baja" },
};
